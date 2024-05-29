import json

from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from django.core.management.base import BaseCommand

import requests
from tqdm import tqdm

from hub.models import Area, AreaType


class Command(BaseCommand):
    help = "Import historical European regions for high-level aggregation"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet: bool = False, *args, **options):
        # https://www.data.gov.uk/dataset/636da066-7044-42d7-8f80-f6631f394f83/european-electoral-regions-december-2018-boundaries-uk-bfe
        download_url = "https://open-geography-portalx-ons.hub.arcgis.com/api/download/v1/items/932f769148bb4753989e55b6703b7add/geojson?layers=0"

        data = requests.get(download_url).json()
        areas = data["features"]

        area_type, created = AreaType.objects.get_or_create(
            name="2018 European Electoral Regions",
            code="EER",
            area_type="European Electoral Region",
            description="European Electoral Region boundaries, as at December 2018",
        )

        if not quiet:
            print("Importing Regions")
        for area in tqdm(areas, disable=quiet):
            a, created = Area.objects.get_or_create(
                mapit_id=area["properties"]["eer18cd"],
                gss=area["properties"]["eer18cd"],
                name=area["properties"]["eer18nm"],
                area_type=area_type,
            )

            geom_str = json.dumps(area)
            geom = GEOSGeometry(json.dumps(area["geometry"]))
            if isinstance(geom, Polygon):
                geom = MultiPolygon([geom])
            geom.srid = 4326
            a.geometry = geom_str
            a.polygon = geom
            a.point = a.polygon.centroid
            a.save()
