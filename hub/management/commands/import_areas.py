import json

# from django postgis
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from django.core.management.base import BaseCommand

from tqdm import tqdm

from hub.models import Area, AreaType
from utils import mapit


class Command(BaseCommand):
    help = "Import basic area information from Mapit"

    boundary_types = [
        {
            "mapit_type": ["WMC"],
            "name": "2010 Parliamentary Constituency",
            "code": "WMC",
            "area_type": "Westminster Constituency",
            "description": "Westminster Parliamentary Constituency boundaries, as created in 2010",
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
        mapit_client = mapit.MapIt()
        for b_type in self.boundary_types:
            areas = mapit_client.areas_of_type(b_type["mapit_type"])
            area_type, created = AreaType.objects.get_or_create(
                name=b_type["name"],
                code=b_type["code"],
                area_type=b_type["area_type"],
                description=b_type["description"],
            )

            if not quiet:
                print(f"Importing {b_type['name']} Areas")
            for area in tqdm(areas, disable=quiet):
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
                    geom_str = json.dumps(geom)
                except mapit.NotFoundException:  # pragma: no cover
                    print(f"could not find mapit area for {area['name']}")
                    geom = None

                a, created = Area.objects.get_or_create(
                    mapit_id=area["id"],
                    gss=area["codes"]["gss"],
                    name=area["name"],
                    area_type=area_type,
                )

            a.geometry = geom_str
            geom = GEOSGeometry(json.dumps(geom["geometry"]))
            if isinstance(geom, Polygon):
                geom = MultiPolygon([geom])
            a.polygon = geom
            a.point = a.polygon.centroid
            a.save()
