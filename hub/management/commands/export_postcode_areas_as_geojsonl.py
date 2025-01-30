import logging
from pathlib import Path

from django.conf import settings

# from django postgis
from django.core.management.base import BaseCommand

from tqdm import tqdm

from hub.models import Area

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import Postcodes from GeoJSON"

    def handle(self, *args, **options):
        area_type_codes = ["PCS", "PCD", "PCA"]
        for area_type_code in area_type_codes:
            output_file: Path = (
                settings.BASE_DIR / "data" / f"{area_type_code}.geojsonl"
            )
            area_geojsons = Area.objects.filter(
                area_type__code=area_type_code
            ).values_list("geometry", flat=True)
            with output_file.open("w") as f:
                for geojson in tqdm(area_geojsons):
                    f.write(geojson)
                    f.write("\n")
