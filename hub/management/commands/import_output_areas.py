import json
import logging
from pathlib import Path

from django.conf import settings
from django.contrib.gis.gdal import CoordTransform, SpatialReference

# from django postgis
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from django.core.management.base import BaseCommand

from tqdm import tqdm

from hub.models import Area, AreaType

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import Census Output Areas from GeoJSON"

    def handle(self, quiet: bool = False, all_names: bool = False, *args, **options):
        filepath: Path = settings.BASE_DIR / "data" / "output_areas.geojson"
        if not filepath.exists():
            print(
                """GeoJSON not found. Download from here:
                  https://www.data.gov.uk/dataset/4d4e021d-fe98-4a0e-88e2-3ead84538537/output-areas-december-2021-boundaries-ew-bgc-v21
                  and save as data/output_areas.geojson"""
            )
            return

        data = filepath.read_text()
        geojson = json.loads(data)

        area_type, created = AreaType.objects.get_or_create(
            name="Output Areas",
            code="OA21",
            area_type="Output Area",
            description="Census output areas",
        )

        for area in tqdm(geojson["features"]):
            self.import_area(area, area_type)

    def import_area(self, area, area_type):
        geom = None
        gss = area["properties"]["OA21CD"]
        name = f"{area['properties']['LSOA21NM']}: {gss}"

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
            )  # putting srid=27700 here fails, but the transform below works
            if isinstance(polygon, Polygon):
                polygon = MultiPolygon([polygon])

            # Create transformation
            source_srid = SpatialReference(27700)
            target_srid = SpatialReference(4326)
            transform = CoordTransform(source_srid, target_srid)

            # Transform the geometry
            polygon.transform(transform)

            geom["geometry"] = polygon.json

            a.geometry = json.dumps(geom)
            a.polygon = polygon
            a.point = a.polygon.centroid
            a.save()
