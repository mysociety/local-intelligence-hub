import json
from django.shortcuts import render

from django.shortcuts import get_object_or_404
from django.views.generic import DetailView, TemplateView
from django.http import JsonResponse
from django.views.decorators.cache import cache_control
from django.utils.decorators import method_decorator

from hub.mixins import TitleMixin
from hub.models import Area, Person, PersonData

cache_settings = {
    "max-age": 60,
    "s-maxage": 3600,
}


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
                context["mp"][item.data_type.name] = item.data
        except Person.DoesNotExist:
            pass

        return context


@method_decorator(cache_control(**cache_settings), name="dispatch")
class FilterAreaView(TemplateView):
    def render_to_response(self, context, **response_kwargs):
        geom = list(Area.objects.filter(geometry__isnull=False).values("geometry"))
        geom = [json.loads(g["geometry"]) for g in geom]
        return JsonResponse({"type": "FeatureCollection", "features": geom})


class StatusView(TemplateView):
    template_name = "hub/status.html"
