import json
import logging
import re
from pathlib import Path

from django.conf import settings
from django.contrib.gis.db.models import Union as GisUnion

# from django postgis
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from django.core.management.base import BaseCommand
from django.db.models import F, Q
from django.db.models.expressions import Expression, RawSQL
from django.db.models.functions import Length, Substr

from tqdm import tqdm

from hub.models import Area, AreaType

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import Postcodes from GeoJSON"

    def add_arguments(self, parser):
        parser.add_argument(
            "-o",
            "--only",
            help="""
            Pass one of {PC, PCS, PCD, PCA} to only import that level of area.
            Note that postcode units (PC) must be imported first.
            """,
        )

    def handle(self, only=None, *args, **options):
        if not only or only == "PC":
            # E.G. N14 7LU
            self.import_postcode_units()
        if not only or only == "PCS":
            # E.G. N14 7
            self.import_postcode_sectors()
        if not only or only == "PCD":
            # E.G. N14
            self.import_postcode_districts()
        if not only or only == "PCA":
            # E.G. N
            self.import_postcode_areas()

    def import_postcode_units(self):
        print("Importing postcode units")
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

            geom["geometry"] = json.loads(polygon.json)

            a.geometry = json.dumps(geom)
            a.polygon = polygon
            a.point = a.polygon.centroid
            a.save()

    def import_postcode_sectors(self):
        print("Importing postcode sectors")
        area_type, created = AreaType.objects.get_or_create(
            name="Postcode Sectors",
            code="PCS",
            area_type="Postcode Sector",
            description="Postcode sectors",
        )
        self.import_postcode_grouping(
            area_type, prefix_expression=Substr(F("gss"), 1, Length(F("gss")) - 2)
        )

    def import_postcode_districts(self):
        print("Importing postcode districts")
        area_type, created = AreaType.objects.get_or_create(
            name="Postcode Districts",
            code="PCD",
            area_type="Postcode District",
            description="Postcode districts",
        )
        self.import_postcode_grouping(
            area_type, prefix_expression=Substr(F("gss"), 1, Length(F("gss")) - 4)
        )

    def import_postcode_areas(self):
        print("Importing postcode areas")
        area_type, created = AreaType.objects.get_or_create(
            name="Postcode Areas",
            code="PCA",
            area_type="Postcode Area",
            description="Postcode areas",
        )
        self.import_postcode_grouping(
            area_type,
            prefix_expression=RawSQL("SUBSTRING(gss FROM '[a-zA-Z]+')", tuple()),
        )

    def import_postcode_grouping(
        self, area_type: AreaType, prefix_expression: Expression
    ):
        """
        Import postcodes grouped by prefix, calculated by the provided expression, into
        the provided area type.
        """
        # Only consider postcodes that contain a space
        # The others are "vertical streets" which are not relevant
        prefixes = (
            Area.objects.filter(Q(gss__contains=" ") & Q(area_type__code="PC"))
            .annotate(prefix=prefix_expression)
            .values_list("prefix", flat=True)
            .distinct()
        )

        for prefix in tqdm(prefixes):
            geom_already_loaded = Area.objects.filter(
                gss=prefix, polygon__isnull=False
            ).exists()
            if geom_already_loaded:
                continue

            postcodes = Area.objects.annotate(prefix=prefix_expression).filter(
                area_type__code="PC", prefix=prefix
            )
            polygon = postcodes.aggregate(union=GisUnion("polygon"))["union"]

            if isinstance(polygon, Polygon):
                polygon = MultiPolygon([polygon])

            geom = {
                "type": "Feature",
                "geometry": json.loads(polygon.json),
                "properties": {
                    "code": prefix,
                    "name": prefix,
                    "type": area_type.code,
                },
            }

            Area.objects.update_or_create(
                gss=prefix,
                area_type=area_type,
                defaults={
                    "name": prefix,
                    "geometry": json.dumps(geom),
                    "polygon": polygon,
                    "point": polygon.centroid,
                },
            )
