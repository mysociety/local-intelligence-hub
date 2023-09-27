import json

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.utils import IntegrityError

from tqdm import tqdm

from hub.models import Area, AreaType


class Command(BaseCommand):
    help = "Import basic area information for new constituencies"

    """
    This uses the geopackage from
      https://pages.mysociety.org/2025-constituencies/datasets/parliament_con_2025/latest
    and then run
      ogr2ogr -f GeoJSON new_constituencies.json parl_constituencies_2025.gpkg -simplify 0.001
    to generate a GeoJSON file to import.
    """
    data_file = settings.BASE_DIR / "data" / "new_constituencies.json"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet: bool = False, *args, **options):
        if not quiet:
            print("Importing Areas")
        with open(self.data_file) as f:
            cons = json.load(f)

        area_type, created = AreaType.objects.get_or_create(
            code="WMC23",
            defaults={
                "name": "Constituencies at the next election",
                "area_type": "Westminster Constituency",
                "description": "Westminster Parliamentary Constituency boundaries, as created by the 2023 Boundary Commission review",
            },
        )

        for con in tqdm(cons["features"], disable=quiet):
            area = con["properties"]
            try:
                a, created = Area.objects.get_or_create(
                    gss=area["gss_code"],
                    name=area["name"],
                    area_type=area_type,
                )
            except IntegrityError as e:
                print(f"error creating {area['name']}: {e}")
                continue

            con["properties"]["PCON13CD"] = area["gss_code"]
            con["properties"]["type"] = "WMC23"
            a.geometry = json.dumps(con)
            a.save()
