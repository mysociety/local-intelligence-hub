# https://open-geography-portalx-ons.hub.arcgis.com/api/download/v1/items/8295b10303ce46c982f62af3733b9405/geojson?layers=0


import json

from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from django.core.management.base import BaseCommand

import requests
from tqdm import tqdm

from hub.models import Area, AreaType


class Command(BaseCommand):
    help = "Import UK countries for high-level aggregation"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet: bool = False, *args, **options):
        # https://www.data.gov.uk/dataset/880c5db0-a977-4c73-8f8f-6c29b01318d4/countries-december-2023-boundaries-uk-bfe
        download_url = "https://open-geography-portalx-ons.hub.arcgis.com/api/download/v1/items/8295b10303ce46c982f62af3733b9405/geojson?layers=0"
        data = requests.get(download_url).json()
        areas = data["features"]

        area_type, created = AreaType.objects.get_or_create(
            name="2023 UK Countries",
            code="CTRY",
            area_type="UK Countries",
            description="UK country boundaries, as at December 2023",
        )

        if not quiet:
            print("Importing Countries")
        for area in tqdm(areas, disable=quiet):
            a, created = Area.objects.get_or_create(
                gss=area["properties"]["CTRY23CD"],
                name=area["properties"]["CTRY23NM"],
                area_type=area_type,
            )
            geom_str = json.dumps(area)
            geom = GEOSGeometry(json.dumps(area["geometry"]))
            if isinstance(geom, Polygon):
                geom = MultiPolygon([geom])
            geom.srid = 27700
            a.geometry = geom_str
            a.polygon = geom
            a.point = a.polygon.centroid
            a.save()
