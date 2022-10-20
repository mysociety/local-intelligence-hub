from django.shortcuts import render

from django.views.generic import TemplateView


class HomePageView(TemplateView):
    template_name = "hub/home.html"


class ExploreView(TemplateView):
    template_name = "hub/explore.html"


class AreaView(TemplateView):
    template_name = "hub/area.html"


class StatusView(TemplateView):
    template_name = "hub/status.html"
