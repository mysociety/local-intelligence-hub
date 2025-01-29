import json
import logging
import re
from pathlib import Path

from django.conf import settings

# from django postgis
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from django.core.management.base import BaseCommand

from tqdm import tqdm

from hub.models import Area, AreaType

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import Postcodes from GeoJSON"

    def handle(self, quiet: bool = False, all_names: bool = False, *args, **options):
        filepaths: list[Path] = [
            settings.BASE_DIR / "data" / f"postcodes_{i}.geojsonl" for i in range(1, 11)
        ]
        for filepath in filepaths:
            if not filepath.exists():
                print(
                    f'Missing {filepath.name}. Download from the Mapped MinIO console, "postcodes" bucket.'
                )
                return

            print(f"Importing postcode file {filepath.name} of 10")

            data = filepath.read_text()
            area_type, created = AreaType.objects.get_or_create(
                name="Postcodes",
                code="PC",
                area_type="Postcode",
                description="Postcodes",
            )

            for line in tqdm(re.split(r"\r?\n", data)):
                if line.strip():
                    area = json.loads(line)
                    self.import_area(area, area_type)

    def import_area(self, area, area_type):
        geom = None
        gss = area["properties"]["POSTCODE"]
        name = gss

        geom_already_loaded = Area.objects.filter(
            gss=gss, polygon__isnull=False
        ).exists()
        if geom_already_loaded:
            # Only fetch geometry data if required, to speed things up
            # logger.debug(f"skipping geometry for {area['name']}")
            pass
        else:
            geom = {
                "type": "Feature",
                "geometry": area["geometry"],
                "properties": {
                    **area["properties"],
                    "code": gss,
                    "name": name,
                    "type": area_type.code,
                },
            }

        a, created = Area.objects.update_or_create(
            gss=gss,
            area_type=area_type,
            defaults={"name": name},
        )

        if geom is not None:
            geos = json.dumps(geom["geometry"])
            polygon = GEOSGeometry(geos)
            if isinstance(polygon, Polygon):
                polygon = MultiPolygon([polygon])

            geom["geometry"] = polygon.json

            a.geometry = json.dumps(geom)
            a.polygon = polygon
            a.point = a.polygon.centroid
            a.save()
