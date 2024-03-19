import json

from django.core.management.base import BaseCommand
from django.contrib.gis.geos import GEOSGeometry, Polygon, MultiPolygon

from tqdm import tqdm

from hub.models import Area, AreaType
from utils import mapit
import requests


class Command(BaseCommand):
    help = "Import Electoral Wards"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet: bool = False, *args, **options):
        # https://www.data.gov.uk/dataset/f8a5e1bb-b2c1-4b01-b9c0-f4d6fa29d65f/wards-may-2023-boundaries-uk-bgc
        download_url = "https://open-geography-portalx-ons.hub.arcgis.com/api/download/v1/items/67c88ea8027244e3b2313c69e3fad503/geojson?layers=0"

        data = requests.get(download_url).json()
        areas = data['features']

        area_type, created = AreaType.objects.get_or_create(
            name="May 2023 Electoral Wards",
            code="WD23",
            area_type="Electoral Ward",
            description="Electoral Ward boundaries, as at May 2023",
        )

        if not quiet:
            print("Importing Electoral Wards")
        for area in tqdm(areas, disable=quiet):
            a, created = Area.objects.get_or_create(
                mapit_id=area["properties"]["WD23CD"],
                gss=area["properties"]["WD23CD"],
                name=area["properties"]["WD23NM"],
                area_type=area_type,
            )

            geom_str = json.dumps(area)
            geom = GEOSGeometry(json.dumps(area['geometry']))
            if isinstance(geom, Polygon):
                geom = MultiPolygon([geom])
            geom.srid = 27700
            a.geometry = geom_str
            a.polygon = geom
            a.point = a.polygon.centroid
            a.save()
