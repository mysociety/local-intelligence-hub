import csv
import json
from collections import defaultdict
from operator import itemgetter

from django.db.models import Count, OuterRef, Subquery
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.views.generic import DetailView, TemplateView, View

from hub.mixins import FilterMixin, TitleMixin
from hub.models import (
    Area,
    AreaData,
    DataSet,
    DataType,
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

cache_settings = {
    "max-age": 60,
    "s-maxage": 3600,
}

RUC_COLOURS = {
    "Rural": "green-700",
    "Urban": "gray-700",
    "Sparse and rural": "green-300",
    "Urban with rural areas": "gray-500",
}


class NotFoundPageView(TitleMixin, TemplateView):
    page_title = "Page not found"
    template_name = "404.html"

    def render_to_response(self, context, **response_kwargs):
        response_kwargs.setdefault("content_type", self.content_type)
        return self.response_class(
            request=self.request,
            template=self.get_template_names(),
            context=context,
            using=self.template_engine,
            status=404,
            **response_kwargs,
        )


class HomePageView(TitleMixin, TemplateView):
    page_title = ""
    template_name = "hub/home.html"


class ExploreView(TitleMixin, TemplateView):
    page_title = "Explore"
    template_name = "hub/explore.html"


class SourcesView(TitleMixin, TemplateView):
    page_title = "Datasets and data sources"
    template_name = "hub/sources.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["datasets"] = DataSet.objects.all().order_by("category", "label")
        return context


class ExploreDatasetsJSON(TemplateView):
    def render_to_response(self, context, **response_kwargs):
        datasets = []
        for d in DataSet.objects.filter(is_filterable=True).all():
            try:
                options = list(map(itemgetter("title"), d.options))
            # catch bad options and ignore them for now
            except TypeError:
                continue

            ds = dict(
                scope="public",
                name=d.name,
                title=d.label,
                source=d.source_label,
                is_favourite=UserDataSets.objects.filter(
                    data_set=d,
                    user=self.request.user,
                ).exists(),
                featured=d.featured,
                comparators=dict(
                    map(itemgetter("field_lookup", "title"), d.comparators)
                ),
                options=options if len(options) > 0 else None,
                defaultValue=d.default_value,
                is_range=d.is_range,
            )
            if d.is_range:
                ds["types"] = [
                    {"name": dt.name, "title": dt.label}
                    for dt in DataType.objects.filter(data_set=d)
                ]
            datasets.append(ds)

        return JsonResponse(list(datasets), safe=False)


class ExploreGeometryJSON(FilterMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        geom = []
        areas = list(self.query().filter(geometry__isnull=False))
        shader = self.shader()
        colours = {}
        if shader is not None:
            colours = shader.colours_for_areas(areas)

        for area in areas:
            geometry = json.loads(area.geometry)
            props = geometry["properties"]
            if colours.get(area.gss, None) is not None:
                props["color"] = colours[area.gss]["colour"]
                props["opacity"] = colours[area.gss]["opacity"]
            else:
                props["color"] = "#ed6832"
                props["opacity"] = 0.7

            geometry["properties"] = props

            geom.append(geometry)

        return JsonResponse({"type": "FeatureCollection", "features": geom})


class ExploreJSON(FilterMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        geom = []
        areas = list(self.query().filter(geometry__isnull=False))
        shader = self.shader()
        colours = {}
        if shader is not None:
            colours = shader.colours_for_areas(areas)

        for area in areas:
            geometry = {
                "properties": {
                    "PCON13CD": area.gss,
                    "name": area.name,
                    "type": area.area_type,
                }
            }
            props = geometry["properties"]
            if colours.get(area.gss, None) is not None:
                props["color"] = colours[area.gss]["colour"]
                props["opacity"] = colours[area.gss]["opacity"]
            else:
                props["color"] = "#ed6832"
                props["opacity"] = 0.7

            geometry["properties"] = props

            geom.append(geometry)

        return JsonResponse({"type": "FeatureCollection", "features": geom})


class ExploreCSV(FilterMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        response = HttpResponse(content_type="text/csv")
        writer = csv.writer(response)
        for row in self.data():
            writer.writerow(row)
        return response


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
        if mp_data["mp_election_majority"]:
            if mp_data["mp_election_majority"] <= 5000:
                tags.append(
                    {
                        "colour": "orange-500",
                        "title": "MP electoral majority less than 5000; Data from UK Parliament",
                        "name": "Marginal seat",
                    }
                )
        red_wall_blue_wall_data = area_data['place'].get("constituency_red_blue_wall", None)
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
                        "colour": "blue-600",
                        "title": "Data from Green Alliance",
                        "name": "Blue wall",
                    }
                )
        # Grab the RUC data
        ruc_data = area_data['place'].get("constituency_ruc", None)
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
        except Person.DoesNotExist:
            pass

        categories = defaultdict(list)
        for data_set in DataSet.objects.order_by("order", "name").all():
            data = self.process_dataset(data_set)

            if data.get("data", None) is not None:
                if data_set.category is not None:
                    categories[data_set.category].append(data)
                else:
                    categories["place"].append(data)

        context["categories"] = categories

        # Create a version of categories that's indexed to make handling the data cleaner
        indexed_categories = defaultdict(dict)
        for category_name, category_items in categories.items():
            for data_item in category_items:
                data_points = data_item['data']
                if type(data_points) == AreaData:
                    data_set_name = data_points.data_type.name
                else:
                    data_set_name = data_points[0].data_type.name
                indexed_categories[category_name].update({data_set_name.replace('-', '_'): data_item})

        tags = self.get_tags(context["mp"], indexed_categories)
        if tags != []:
            context["area_tags"] = tags
            red_wall_blue_wall = indexed_categories['place'].get("constituency_red_blue_wall", None)
            if red_wall_blue_wall:
                context["categories"]["place"].remove(red_wall_blue_wall)
            ruc = indexed_categories['place'].get("constituency_ruc", None)
            if ruc:
                context["categories"]["place"].remove(ruc)
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


class StyleView(TitleMixin, TemplateView):
    page_title = "Style preview"
    template_name = "hub/style.html"

    def get_context_data(self, **kwargs):  # pragma: no cover
        context = super().get_context_data(**kwargs)
        context["shades"] = [(i * 100) for i in range(1, 10)]
        context["colors"] = [
            "blue",
            "indigo",
            "purple",
            "pink",
            "red",
            "orange",
            "yellow",
            "green",
            "teal",
            "cyan",
            "gray",
        ]
        context["theme_colors"] = [
            "primary",
            "secondary",
            "success",
            "info",
            "warning",
            "danger",
            "light",
            "dark",
        ]
        context["button_styles"] = ["", "outline-"]
        context["heading_levels"] = range(1, 7)
        context["display_levels"] = range(1, 7)
        context["sizes"] = [
            "-sm",
            "",
            "-lg",
        ]

        return context


class StatusView(TemplateView):
    template_name = "hub/status.html"
