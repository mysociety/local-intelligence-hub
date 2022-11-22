import json
from collections import defaultdict

from django.db.models import Count, OuterRef, Q, Subquery
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_control
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

        categories = defaultdict(list)
        for data_set in (
            DataSet.objects.filter(
                Q(featured=True)
                | Q(
                    id__in=Subquery(
                        UserDataSets.objects.filter(
                            user=self.request.user, data_set_id=OuterRef("id")
                        ).values_list("data_set_id", flat=True)
                    )
                ),
            )
            .order_by("order", "name")
            .all()
        ):
            data = self.process_dataset(data_set)

            if data.get("data", None) is not None:
                if data_set.category is not None:
                    categories[data_set.category].append(data)
                else:
                    categories["place"].append(data)

        data_sets = (
            AreaData.objects.filter(area=self.object)
            .distinct("data_type__data_set__id")
            .values_list("data_type__data_set__id", flat=True)
        )
        cat_counts = (
            DataSet.objects.filter(pk__in=data_sets)
            .values("category")
            .annotate(categories=Count("category"))
        )
        counts = {}
        for count in cat_counts.all():
            category = count["category"]
            counts[category] = count["categories"]
            counts[category] -= len(categories[category])

        context["counts"] = counts
        context["categories"] = categories
        return context


class AreaCategoryView(BaseAreaView):
    model = Area
    template_name = "hub/category.html"
    context_object_name = "area"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        category = self.kwargs.get("category")

        category_data = []
        for data_set in (
            DataSet.objects.filter(category=category)
            .order_by("-featured", "order", "name")
            .all()
        ):
            data = self.process_dataset(data_set)

            if data.get("data", None) is not None:
                category_data.append(data)

        context["category_data"] = category_data
        context["category"] = category
        context["category_title"] = category.capitalize()

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
