from collections import defaultdict

from django.db.models import Count, OuterRef, Subquery
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.views.generic import DetailView, TemplateView, View

from hub.mixins import TitleMixin
from hub.models import (
    Area,
    AreaData,
    AreaType,
    DataSet,
    Person,
    PersonData,
    UserDataSets,
)
from utils import is_valid_postcode
from utils.mapit import (
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    MapIt,
    NotFoundException,
)

RUC_COLOURS = {
    "Rural": "green-400",
    "Urban": "gray-400",
    "Sparse and rural": "green-200",
    "Urban with rural areas": "gray-300",
}


class BaseAreaView(TitleMixin, DetailView):
    model = Area
    context_object_name = "area"

    def get_object(self):
        return get_object_or_404(
            Area,
            area_type=AreaType.objects.get(code=self.kwargs.get("area_type")),
            name=self.kwargs.get("name"),
        )

    def get_page_title(self):
        return self.object.name

    def process_dataset(self, data_set):
        fav_sq = Subquery(
            UserDataSets.objects.filter(
                data_set_id=OuterRef("data_type__data_set__id"),
                user=self.request.user,
            )
            .values("data_set_id")
            .annotate(is_favourite=Count("id"))
            .values("is_favourite")
        )
        data = {
            "name": str(data_set),
            "db_name": data_set.name,
            "label": data_set.label,
            "source": data_set.source_name,
            "subcategory": data_set.subcategory,
            "source_url": data_set.source_url,
            "category": data_set.category,
            "pk": data_set.pk,
            "data_type": data_set.data_type,
            "featured": data_set.featured,
            "excluded_countries": data_set.exclude_countries,
        }
        if data_set.is_range:
            data["is_range"] = True
            data_range = (
                AreaData.objects.filter(
                    area=self.object,
                    data_type__data_set=data_set,
                )
                .select_related("data_type")
                .order_by("data_type__name")
            )

            data["is_favourite"] = UserDataSets.objects.filter(
                data_set=data_set,
                user=self.request.user,
            ).exists()
            d = data_range.all()
            if len(d) == 0:
                d = None

            data["data"] = d
        elif data_set.category == "opinion":
            data_range = (
                AreaData.objects.filter(
                    area=self.object,
                    data_type__data_set=data_set,
                )
                .annotate(is_favourite=fav_sq)
                .select_related("data_type")
                .order_by("data_type__order", "data_type__label")
            )

            data["data"] = data_range.all()
        else:
            area_data = (
                AreaData.objects.filter(area=self.object, data_type__data_set=data_set)
                .annotate(is_favourite=fav_sq)
                .select_related("data_type")
            )
            if area_data:
                data["data"] = area_data[0]

        return data


class AreaView(BaseAreaView):
    model = Area
    template_name = "hub/area.html"
    context_object_name = "area"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        try:
            context["mp"] = {"person": Person.objects.get(area=self.object)}

            data = PersonData.objects.filter(
                person=context["mp"]["person"]
            ).select_related("data_type")
            for item in data.all():
                if (
                    item.data_type.name == "select_committee_membership"
                    and "select_committee_memberships" not in context["mp"]
                ):
                    context["mp"]["select_committee_memberships"] = [
                        datum["data"]
                        for datum in PersonData.objects.filter(
                            person=context["mp"]["person"]
                        )
                        .filter(data_type__name="select_committee_membership")
                        .values()
                    ]
                else:
                    context["mp"][item.data_type.name] = item.value()
            context["mp"]["appg_memberships"] = [
                item.value()
                for item in data.filter(data_type__name="mp_appg_memberships")
            ]
            context["mp"]["votes"] = [
                {
                    "name": item.data_type.data_set.label,
                    "vote": item.value(),
                    "url": f"https://votes.parliament.uk/Votes/Commons/Division/{item.data_type.name.split('_')[0]}",
                }
                for item in data.filter(data_type__data_set__subcategory="vote")
            ]
            context["mp"]["support"] = [
                {
                    "name": item.data_type.data_set.label,
                    "position": item.value(),
                    "url": f"https://edm.parliament.uk/early-day-motion/{item.data_type.name.split('_')[0]}",
                }
                for item in data.filter(data_type__data_set__subcategory="supporter")
            ]

        except Person.DoesNotExist:
            pass

        categories = defaultdict(list)
        indexed_categories = defaultdict(dict)
        for data_set in DataSet.objects.order_by("order", "label").all():
            data = self.process_dataset(data_set)

            if data.get("data", None) is not None and data["data"]:
                if data_set.category is not None:
                    if not isinstance(data["data"], AreaData):
                        if len(data["data"]) == 1:
                            data["data"] = data["data"][0]
                    categories[data_set.category].append(data)
                else:
                    categories["place"].append(data)

                indexed_categories[data["db_name"]] = data

        context["related_categories"] = {
            "constituency_christian_aid_group_count": "constituency_christian_aid_groups",
            "constituency_foe_groups_count": "constituency_foe_groups",
            "constituency_nt_properties_count": "constituency_nt_properties",
            "constituency_wi_group_count": "constituency_wi_groups",
            "power_postcodes_count": "power_postcodes",
        }

        context["is_related_category"] = context["related_categories"].values()

        categories_to_remove = defaultdict(list)

        try:
            context["country"] = indexed_categories["country"]["data"].value()
        except (ValueError, KeyError):
            context["country"] = None

        if context["country"] is not None:
            for category, items in categories.items():
                for data_set in items:
                    if (
                        context["related_categories"].get(data_set["db_name"], None)
                        is not None
                    ):
                        data_item = indexed_categories[
                            context["related_categories"][data_set["db_name"]]
                        ]
                        if len(data_item) > 0:
                            data_set["related_category"] = data_item
                            categories_to_remove["movement"].append(data_item)

                    if context["country"] in data_set["excluded_countries"]:
                        categories_to_remove[category].append(data_set)

        for category_name, items in categories_to_remove.items():
            for item in items:
                categories[category_name].remove(item)

        context["categories"] = categories
        context["indexed_categories"] = indexed_categories

        return context


class AreaSearchView(TemplateView):
    template_name = "hub/area_search.html"

    def render_to_response(self, context):
        areas = context.get("areas")
        if areas and len(areas) == 1:
            return redirect(areas[0])

        return super().render_to_response(context)

    def get_areas_from_mapit(self, **kwargs):
        areas = None
        err = None

        try:
            mapit = MapIt()
            if kwargs.get("lon") and kwargs.get("lat"):
                gss_codes = mapit.wgs84_point_to_gss_codes(kwargs["lon"], kwargs["lat"])
            elif kwargs.get("pc"):
                gss_codes = mapit.postcode_point_to_gss_codes(kwargs["pc"])

            areas = Area.objects.filter(gss__in=gss_codes)
            areas = list(areas)
        except (
            NotFoundException,
            BadRequestException,
            InternalServerErrorException,
            ForbiddenException,
        ) as error:
            err = error

        return (areas, err)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        search = self.request.GET.get("search")
        lon = self.request.GET.get("lon")
        lat = self.request.GET.get("lat")

        context["search"] = search

        if lon and lat:
            areas, error = self.get_areas_from_mapit(lon=lon, lat=lat)
            context["areas"] = areas
            context["error"] = error
        elif is_valid_postcode(search):
            areas, error = self.get_areas_from_mapit(pc=search)
            context["areas"] = areas
            context["error"] = error
        elif search == "":
            context["error"] = "Please enter a constituency name, MP name, or postcode."
        else:
            areas_raw = Area.objects.filter(name__icontains=search)
            people_raw = Person.objects.filter(name__icontains=search)

            areas = list(areas_raw)
            for person in people_raw:
                areas.append(person.area)

            if len(areas) == 0:
                context[
                    "error"
                ] = f"Sorry, we can’t find a UK location matching “{search}”. Try a nearby town or city?"
            else:
                for area in areas:
                    try:
                        area.mp = Person.objects.get(area=area)
                    except Person.DoesNotExist:
                        pass
                areas.sort(key=lambda area: area.name)
                context["areas"] = areas

        return context


class FavouriteDataSetView(View):
    def post(self, request, data_set):
        ds = get_object_or_404(DataSet, pk=data_set)
        user = request.user

        fav, created = UserDataSets.objects.get_or_create(data_set=ds, user=user)

        if self.request.accepts("text/html"):
            return redirect(self.request.META["HTTP_REFERER"])
        else:
            data = {
                "pk": fav.pk,
            }
            return JsonResponse(data)


class UnFavouriteDataSetView(View):
    def post(self, request, data_set):
        fav = get_object_or_404(UserDataSets, data_set=data_set, user=request.user)
        fav.delete()

        if self.request.accepts("text/html"):
            return redirect(self.request.META["HTTP_REFERER"])
        else:
            data = {
                "deleted": True,
            }
            return JsonResponse(data)
