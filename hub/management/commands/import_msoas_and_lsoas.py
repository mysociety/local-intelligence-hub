import json
import logging
from pathlib import Path

from django.conf import settings

# from django postgis
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from django.core.management.base import BaseCommand

from tqdm import tqdm

from hub.models import Area, AreaType

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import MSOAs and LSOAs from GeoJSON"

    def handle(self, *args, **options):
        missing_files = False
        msoa_filepath: Path = settings.BASE_DIR / "data" / "msoas.geojson"
        if not msoa_filepath.exists():
            print(
                """GeoJSON not found. Download from here:
                  https://geoportal.statistics.gov.uk/datasets/ons::middle-layer-super-output-areas-december-2021-boundaries-ew-bgc-v3-2/about
                  and save as data/msoas.geojson"""
            )
            missing_files = True
        lsoa_filepath: Path = settings.BASE_DIR / "data" / "lsoas.geojson"
        if not lsoa_filepath.exists():
            print(
                """GeoJSON not found. Download from here:
                  https://geoportal.statistics.gov.uk/datasets/ons::lower-layer-super-output-areas-december-2021-boundaries-ew-bgc-v5-2/about
                  and save as data/lsoas.geojson"""
            )
            missing_files = True
        if missing_files:
            return

        msoa_data = msoa_filepath.read_text()
        geojson = json.loads(msoa_data)

        area_type, created = AreaType.objects.get_or_create(
            name="Middle Super Output Areas",
            code="MSOA",
            area_type="Middle Super Output Area",
            description="Middle Super Output Areas",
        )

        print("Importing MSOAs, LSOAs to come...")
        for area in tqdm(geojson["features"]):
            self.import_area(area, area_type, "MSOA21")

        lsoa_data = lsoa_filepath.read_text()
        geojson = json.loads(lsoa_data)

        print("Importing LSOAs")
        area_type, created = AreaType.objects.get_or_create(
            name="Lower Super Output Areas",
            code="LSOA",
            area_type="Lower Super Output Area",
            description="Lower Super Output Areas",
        )

        for area in tqdm(geojson["features"]):
            self.import_area(area, area_type, "LSOA21")

        print("Done")

    def import_area(self, area, area_type, property_prefix):
        geom = None
        code_property = f"{property_prefix}CD"
        name_property = f"{property_prefix}NM"
        gss = area["properties"][code_property]
        name = area['properties'][name_property]

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
            polygon = GEOSGeometry(
                geos
            )
            if isinstance(polygon, Polygon):
                polygon = MultiPolygon([polygon])

            geom["geometry"] = polygon.json

            a.geometry = json.dumps(geom)
            a.polygon = polygon
            a.point = a.polygon.centroid
            a.save()
