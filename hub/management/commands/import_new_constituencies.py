from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaType


class Command(BaseCommand):
    help = "Import basic area information for new constituencies"

    data_file = settings.BASE_DIR / "data" / "new_constituencies.csv"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet: bool = False, *args, **options):
        if not quiet:
            print("Importing Areas")
        df = pd.read_csv(self.data_file)
        area_type, created = AreaType.objects.get_or_create(
            name="2023 Parliamentary Constituency",
            code="WMC23",
            area_type="Westminster Constituency",
            description="Westminster Parliamentary Constituency boundaries, as created in 2023",
        )

        for index, area in tqdm(df.iterrows(), disable=quiet):
            a, created = Area.objects.get_or_create(
                gss=area["PCON25CD"],
                name=area["PCON25NM"],
                area_type=area_type,
            )
            geom = area[
                [
                    "BNG_E",
                    "BNG_N",
                    "LAT",
                    "LONG",
                    "Shape__Area",
                    "Shape__Length",
                    "GlobalID",
                ]
            ].to_dict()
            a.geometry = geom
            a.save()
