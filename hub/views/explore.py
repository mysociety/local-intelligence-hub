import csv
import json
from operator import itemgetter

from django.http import HttpResponse, JsonResponse
from django.views.generic import TemplateView

from hub.mixins import FilterMixin, TitleMixin
from hub.models import DataSet, DataType, UserDataSets


class ExploreView(TitleMixin, TemplateView):
    page_title = "Explore"
    template_name = "hub/explore.html"


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
                is_in=True if d.comparators[0]["field_lookup"] == "in" else False,
                is_range=d.is_range,
                data_type=d.data_type,
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
