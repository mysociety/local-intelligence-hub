import json

from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from django.core.management.base import BaseCommand
from django.db.utils import IntegrityError

from mysoc_dataset import get_dataset_df
from tqdm import tqdm

from hub.models import Area, AreaOverlap, AreaType
from utils.constituency_mapping import get_overlap_df


class Command(BaseCommand):
    help = "Import basic area information for new constituencies"

    """
    This uses the geopackage from
      https://pages.mysociety.org/2025-constituencies/datasets/parliament_con_2024/latest
    and then run
      ogr2ogr -f GeoJSON new_constituencies.json parl_constituencies_2024.gpkg -simplify 0.001
    to generate a GeoJSON file to import.
    """
    data_file = settings.BASE_DIR / "data" / "new_constituencies.json"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet: bool = False, *args, **options):
        if not quiet:
            print("Importing 2024 Constituencies")
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

            geom_str = json.dumps(con)
            geom = GEOSGeometry(json.dumps(con["geometry"]))
            if isinstance(geom, Polygon):
                geom = MultiPolygon([geom])
            a.geometry = geom_str
            a.polygon = geom
            a.point = a.polygon.centroid
            a.save()

        constituency_lookup = (
            get_dataset_df(
                repo_name="2025-constituencies",
                package_name="parliament_con_2024",
                version_name="latest",
                file_name="parl_constituencies_2024.csv",
            )
            .set_index("short_code")["gss_code"]
            .to_dict()
        )

        df = get_overlap_df("PARL10", "PARL25")
        for area in Area.objects.filter(area_type__code="WMC"):
            overlap_constituencies = df.query("PARL10 == @area.gss")
            for _, row in overlap_constituencies.iterrows():
                new_area = Area.objects.get(
                    area_type__code="WMC23", gss=constituency_lookup[row["PARL25"]]
                )
                AreaOverlap.objects.get_or_create(
                    area_old=area,
                    area_new=new_area,
                    defaults={
                        "population_overlap": int(row["percentage_overlap_pop"] * 100),
                        "area_overlap": int(row["percentage_overlap_area"] * 100),
                    },
                )
