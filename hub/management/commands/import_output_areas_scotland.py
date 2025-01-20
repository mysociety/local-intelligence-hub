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
    help = "Import Census Output Areas from GeoJSON"

    def handle(self, quiet: bool = False, all_names: bool = False, *args, **options):
        filepath: Path = settings.BASE_DIR / "data" / "output_areas_scotland.geojson"
        if not filepath.exists():
            print(
                """GeoJSON not found. Download from here: 
                  https://www.nrscotland.gov.uk/media/uwdpx4hn/output-area-2022-mhw.zip
                  Extract and convert to GeoJSON using ogr2ogr:
                      ogr2ogr -of geojson -s_srs EPSG:27700 -t_srs EPSG:4326 output_areas_scotland.geojson OutputArea2022_MHW.shp
                  then place output_areas_scotland.geojson in the data directory."""
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
        gss = area["properties"]["code"]

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
                    "name": gss,
                    "type": area_type.code,
                },
            }

        a, created = Area.objects.update_or_create(
            gss=gss,
            area_type=area_type,
            defaults={"name": gss},
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
