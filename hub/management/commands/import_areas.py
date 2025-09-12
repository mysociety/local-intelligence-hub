import json

from django.contrib.sites.models import Site
from django.core.management.base import CommandError

from tqdm import tqdm

from hub.models import Area, AreaType
from utils.mapit import MapIt, NotFoundException

from .base_importers import BaseImportCommand


class Command(BaseImportCommand):
    help = "Import basic area information from MaPit"

    _site_name = None

    boundary_types = [
        {
            "mapit_type": ["WMC"],
            "mapit_generation": 54,
            "code": "WMC",
            "area_type": "Westminster Constituency",
            "name_singular": "Pre-2024 Parliamentary Constituency",
            "name_plural": "Pre-2024 Parliamentary Constituencies",
            "short_name_singular": "constituency",
            "short_name_plural": "constituencies",
            "description": "Westminster Parliamentary Constituencies, as created in 2010.",
        },
        {
            "mapit_type": ["WMC"],
            "mapit_generation": None,
            "code": "WMC23",
            "area_type": "Westminster Constituency",
            "name_singular": "Parliamentary Constituency",
            "name_plural": "Parliamentary Constituencies",
            "short_name_singular": "constituency",
            "short_name_plural": "constituencies",
            "description": "Westminster Parliamentary Constituencies, as created in 2023, and first used at the 2024 General Election.",
        },
        {
            "mapit_type": ["LBO", "UTA", "COI", "LGD", "CTY", "MTD"],
            "mapit_generation": None,
            "code": "STC",
            "area_type": "Single Tier Council",
            "name_singular": "Single Tier Council",
            "name_plural": "Single Tier Councils",
            "short_name_singular": "council",
            "short_name_plural": "councils",
            "description": "This includes Unitary Authorities, London Boroughs, and County Councils in England, as well as all councils in Scotland, Wales, and Nothern Ireland.",
        },
        {
            "mapit_type": ["DIS", "NMD"],
            "mapit_generation": None,
            "code": "DIS",
            "area_type": "District Council",
            "name_singular": "District Council",
            "name_plural": "District Councils",
            "short_name_singular": "council",
            "short_name_plural": "councils",
            "description": "In “two tier” council areas, District Councils look after local services like rubbish collection, recycling, housing, and planning applications, while a County Council looks after everything else.",
        },
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

        parser.add_argument(
            "--diagnostics",
            action="store_true",
            help="Print out extra diagnostics - very verbose",
        )

        parser.add_argument(
            "-s",
            "--site",
            action="store",
            help="Name of site to add dataset to",
        )

        parser.add_argument(
            "--all_sites",
            action="store_true",
            help="Add dataset to all sites",
        )

    def get_site(self):
        if self._site_name:
            try:
                site = Site.objects.get(name=self._site_name)
                self.site = site
            except Site.DoesNotExist:
                raise CommandError(f"No such site: {self._site_name}", returncode=1)
        elif self._all_sites:
            self.all_sites = Site.objects.all()

    def handle(self, quiet: bool = False, diagnostics: bool = False, *args, **options):
        self._site_name = options.get("site")
        self._all_sites = options.get("all_sites")
        self.get_site()
        mapit_client = MapIt()
        for b_type in self.boundary_types:
            areas = mapit_client.areas_of_type(
                b_type["mapit_type"], generation=b_type["mapit_generation"]
            )
            if diagnostics:
                print(
                    f"fetched mapit areas with type {b_type['mapit_type']}, generation {b_type['mapit_generation']}, our type {b_type['code']}"
                )
            area_type, created = AreaType.objects.get_or_create(
                code=b_type["code"],
                defaults={
                    "area_type": b_type["area_type"],
                    "name_singular": b_type["name_singular"],
                    "name_plural": b_type["name_plural"],
                    "description": b_type["description"],
                },
            )

            self.add_object_to_site(area_type)

            if diagnostics or not quiet:
                print(f"Importing {b_type['name_plural']}")
            disable = quiet or diagnostics
            for area in tqdm(areas, disable=disable):
                if diagnostics:
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
                except NotFoundException:
                    print(f"could not find mapit area for {area['name']}")
                    geom = None

                if diagnostics:
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
                if diagnostics:
                    print("--")

            if diagnostics:
                print("\n\033[31m######################\033[0m\n")
