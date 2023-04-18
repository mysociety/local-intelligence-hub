from django.db import connection
from django.db.utils import OperationalError
from django.http import JsonResponse
from django.views.generic import TemplateView

from hub.mixins import TitleMixin
from hub.models import Area, DataSet


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


class SourcesView(TitleMixin, TemplateView):
    page_title = "Datasets and data sources"
    template_name = "hub/sources.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["datasets"] = DataSet.objects.all().order_by("category", "label")
        return context


class PrivacyView(TitleMixin, TemplateView):
    page_title = "Privacy policy"
    template_name = "hub/privacy.html"


class AboutView(TitleMixin, TemplateView):
    page_title = "About"
    template_name = "hub/about.html"


class ContactView(TitleMixin, TemplateView):
    page_title = "Contact us"
    template_name = "hub/contact.html"


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
    def render_to_response(self, context, **response_kwargs):
        try:
            with connection.cursor() as cursor:
                # will raise OperationalError if db unavailable
                cursor.execute("select 1")

            return JsonResponse(
                {
                    "database": "ok",
                    "areas": Area.objects.count(),
                    "datasets": DataSet.objects.count(),
                }
            )
        except OperationalError:
            return JsonResponse(
                {
                    "database": "error",
                },
                status=500,
            )
