import json

from django.core.management.base import BaseCommand

from tqdm import tqdm

from hub.models import Area, AreaType
from utils import mapit


class Command(BaseCommand):
    help = "Import basic area information from MaPit"

    boundary_types = [
        {
            "mapit_type": ["WMC"],
            "name": "2023 Parliamentary Constituency",
            "code": "WMC23",
            "area_type": "Westminster Constituency",
            "description": "Westminster Parliamentary Constituency boundaries, as created in 2023",
        },
        {
            "mapit_type": ["LBO", "UTA", "COI", "LGD", "CTY", "MTD"],
            "name": "Single Tier Councils",
            "code": "STC",
            "area_type": "Single Tier Council",
            "description": "Single Tier Council",
        },
        {
            "mapit_type": ["DIS", "NMD"],
            "name": "District Councils",
            "code": "DIS",
            "area_type": "District Council",
            "description": "District Council",
        },
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet: bool = False, *args, **options):
        quiet = True
        mapit_client = mapit.MapIt()
        for b_type in self.boundary_types:
            areas = mapit_client.areas_of_type(b_type["mapit_type"])
            print(
                f"fetched mapit areas with type {b_type['mapit_type']}, our type {b_type['code']}"
            )
            area_type, created = AreaType.objects.get_or_create(
                code=b_type["code"],
                area_type=b_type["area_type"],
                defaults={
                    "name": b_type["name"],
                    "description": b_type["description"],
                },
            )

            if not quiet:
                print(f"Importing {b_type['name']} Areas")
            for area in tqdm(areas, disable=quiet):
                print(f"looking at {area['name']}, mapit type {area['type']}")
                try:
                    geom = mapit_client.area_geometry(area["id"])
                    geom = {
                        "type": "Feature",
                        "geometry": geom,
                        "properties": {
                            "PCON13CD": area["codes"]["gss"],
                            "name": area["name"],
                            "type": b_type["code"],
                        },
                    }
                    geom = json.dumps(geom)
                except mapit.NotFoundException:  # pragma: no cover
                    print(f"could not find mapit area for {area['name']}")
                    geom = None

                print(
                    f"creating area for {area['name']} with GSS {area['codes']['gss']}, mapit_id {area['id']}"
                )
                try:
                    a, created = Area.objects.update_or_create(
                        name=area["name"],
                        area_type=area_type,
                        defaults={
                            "mapit_id": area["id"],
                            "gss": area["codes"]["gss"],
                        },
                    )
                except Area.MultipleObjectsReturned:
                    print(
                        f"\033[31area {area['name']} already exists, giving up\033[0m"
                    )
                    exit()

                a.geometry = geom
                a.save()
                print("--")

            print("\n\033[31m######################\033[0m\n")
