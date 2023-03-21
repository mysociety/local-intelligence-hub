from collections import defaultdict

from django.db.models import Count, OuterRef, Subquery
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.views.generic import DetailView, TemplateView, View

from hub.mixins import TitleMixin
from hub.models import Area, AreaData, DataSet, Person, PersonData, UserDataSets
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
            Area, area_type=self.kwargs.get("area_type"), name=self.kwargs.get("name")
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
            "label": data_set.label,
            "source": data_set.source_name,
            "subcategory": data_set.subcategory,
            "source_url": data_set.source_url,
            "category": data_set.category,
            "pk": data_set.pk,
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
            data["data"] = data_range.all()
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

    def get_tags(self, mp_data, area_data):
        tags = []
        # Check to see if it's a marginal seat
        if mp_data.get("mp_election_majority", None):
            if mp_data["mp_election_majority"] <= 5000:
                tags.append(
                    {
                        "colour": "yellow-400",
                        "title": "MP electoral majority less than 5000; Data from UK Parliament",
                        "name": "Marginal seat",
                    }
                )
        red_wall_blue_wall_data = area_data["place"].get(
            "constituency_red_blue_wall", None
        )
        if red_wall_blue_wall_data:
            red_wall_blue_wall = red_wall_blue_wall_data["data"].value()
            if red_wall_blue_wall == "Red Wall":
                tags.append(
                    {
                        "colour": "red-500",
                        "title": "Data from Green Alliance",
                        "name": "Red wall",
                    }
                )
            else:
                tags.append(
                    {
                        "colour": "blue-500",
                        "title": "Data from Green Alliance",
                        "name": "Blue wall",
                    }
                )
        power_postcode = area_data["movement"].get("power_postcodes", None)
        if power_postcode:
            tags.append(
                {
                    "colour": "teal-200",
                    "title": "Aid Alliance Power Postcode",
                    "name": "Aid Alliance Power Postcode",
                }
            )
        # Grab the RUC data
        ruc_data = area_data["place"].get("constituency_ruc", None)
        if ruc_data:
            ruc = ruc_data["data"].data
            tags.append(
                {
                    "colour": RUC_COLOURS[ruc],
                    "title": "Urban Rural Classification",
                    "name": ruc,
                }
            )

        return tags

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
                    "position": "Support",
                    "url": f"https://edm.parliament.uk/early-day-motion/{item.data_type.name.split('_')[0]}",
                }
                for item in data.filter(data_type__data_set__subcategory="supporter")
            ]
            if context["mp"]["support"] == []:
                context["mp"]["support"] = None
        except Person.DoesNotExist:
            pass

        categories = defaultdict(list)
        for data_set in DataSet.objects.order_by("order", "name").all():
            if data_set.name == "constituency_foe_groups_count":
                continue
            data = self.process_dataset(data_set)

            if data.get("data", None) is not None:
                if data_set.category is not None:
                    if type(data["data"]) != AreaData:
                        if len(data["data"]) == 1:
                            data["data"] = data["data"][0]
                    categories[data_set.category].append(data)
                else:
                    categories["place"].append(data)

        context["categories"] = categories

        # Create a version of categories that's indexed to make handling the data cleaner
        indexed_categories = defaultdict(dict)
        for category_name, category_items in categories.items():
            for data_item in category_items:
                data_points = data_item["data"]
                if type(data_points) == AreaData:
                    data_set_name = data_points.data_type.data_set.name
                else:
                    if len(data_points) != 0:
                        data_set_name = data_points[0].data_type.data_set.name
                        if len(data_points) == 1:
                            data["data"] = data_points[0]
                    else:
                        data_set_name = None
                if data_set_name:
                    indexed_categories[category_name].update(
                        {data_set_name.replace("-", "_"): data_item}
                    )

        tags = self.get_tags(context.get("mp", {}), indexed_categories)
        if tags != []:
            context["area_tags"] = tags
            red_wall_blue_wall = indexed_categories["place"].get(
                "constituency_red_blue_wall", None
            )
            if red_wall_blue_wall:
                context["categories"]["place"].remove(red_wall_blue_wall)
            ruc = indexed_categories["place"].get("constituency_ruc", None)
            if ruc:
                context["categories"]["place"].remove(ruc)
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
