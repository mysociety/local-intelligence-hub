from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet, DataType


class Command(BaseCommand):
    help = "Import data about area age spread"

    data_url = "https://data.parliament.uk/resources/constituencystatistics/PowerBIData/Demography/Population.xlsx"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = pd.read_excel(self.data_url, sheet_name="Age group data")

        defaults = {
            "label": "Constituency Age Distribution",
            "description": "Constituency Age Distribution",
            "data_type": "float",
            "category": "place",
            "source": self.data_url,
            "is_range": True,
        }

        data_set, created = DataSet.objects.update_or_create(
            name="constituency_age_distribution",
            defaults=defaults,
        )

        averages = {}
        df = df.loc[df["Date"] == 2020]
        if not self._quiet:
            self.stdout.write("Importing constituency age distribution")
        for index, row in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            age_group = row["Age group"]
            gss = row["ONSConstID"]

            data_type, created = DataType.objects.get_or_create(
                data_set=data_set,
                name=f"ages_{age_group}",
                data_type="float",
                label=f"Ages {age_group}",
            )

            try:
                area = Area.objects.get(gss=gss)
            except Area.DoesNotExist:
                self.stdout.write(f"Failed to find area with code {gss}")
                continue

            averages[data_type.name] = row["UK%"] * 100

            AreaData.objects.update_or_create(
                data_type=data_type,
                area=area,
                defaults={"data": row["Const%"] * 100},
            )

        for name, average in averages.items():
            data_type = DataType.objects.get(name=name)
            data_type.average = average
            data_type.save()
