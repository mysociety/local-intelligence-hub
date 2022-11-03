import json

from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_control
from django.views.generic import DetailView, TemplateView

from hub.mixins import TitleMixin
from hub.models import Area, AreaData, Person, PersonData
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


class AreaView(TitleMixin, DetailView):
    model = Area
    template_name = "hub/area.html"
    context_object_name = "area"

    def get_object(self):
        return get_object_or_404(
            Area, area_type=self.kwargs.get("area_type"), name=self.kwargs.get("name")
        )

    def get_page_title(self):
        return self.object.name

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        try:
            context["mp"] = {"person": Person.objects.get(area=self.object)}

            data = PersonData.objects.filter(
                person=context["mp"]["person"]
            ).select_related("data_type")
            for item in data.all():
                context["mp"][item.data_type.name] = item.value()
        except Person.DoesNotExist:
            pass

        age_ranges = (
            AreaData.objects.filter(
                area=self.object,
                data_type__data_set__name="constituency_age_distribution",
            )
            .select_related("data_type")
            .order_by("data_type__name")
        )

        context["age_ranges"] = age_ranges.all()

        context["fuel_poverty"] = AreaData.objects.filter(
            area=self.object, data_type__name="fuel_poverty"
        ).select_related("data_type")[0]

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


@method_decorator(cache_control(**cache_settings), name="dispatch")
class FilterAreaView(TemplateView):
    def render_to_response(self, context, **response_kwargs):
        geom = list(Area.objects.filter(geometry__isnull=False).values("geometry"))
        geom = [json.loads(g["geometry"]) for g in geom]
        return JsonResponse({"type": "FeatureCollection", "features": geom})


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
