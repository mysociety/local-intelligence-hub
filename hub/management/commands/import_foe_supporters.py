from time import sleep

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Avg, IntegerField
from django.db.models.functions import Cast

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet, DataType


class Command(BaseCommand):
    help = "Import data about number of FOE supporters per constituency"

    data_file = settings.BASE_DIR / "data" / "foe_supporters.csv"
    cols = ["activists", "supporters"]
    data_types = {}

    def get_dataframe(self):
        df = pd.read_csv(self.data_file, thousands=",")
        df = df.dropna(axis="columns", how="all")
        df = df.dropna(axis="rows", how="any")
        df.columns = ["constituency", "supporters", "activists"]
        df = df.astype({"supporters": int, "activists": int})

        return df

    def add_data_sets(self, df):
        defaults = {
            "data_type": "integer",
            "category": "movement",
            "source_label": "Friends of the Earth",
            "source": "https://friendsoftheearth.uk/",
            "source_type": "google sheet",
            "data_url": "",
        }

        for col in self.cols:
            label = f"Number of Friends of the Earth {col}"

            data_set, created = DataSet.objects.update_or_create(
                name=f"constituency_foe_{col}_count",
                defaults={
                    "label": label,
                    "description": label,
                    **defaults,
                },
            )

            data_type, created = DataType.objects.update_or_create(
                data_set=data_set,
                name=f"constituency_foe_{col}_count",
                defaults={
                    "data_type": "integer",
                    "label": label,
                    "description": label,
                },
            )

            self.data_types[col] = data_type

    def process_data(self, df):
        AreaData.objects.filter(data_type__in=self.data_types.values()).delete()

        if not self._quiet:
            self.stdout.write("Importing FOE supporters data")
        for index, row in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            cons = row["constituency"]

            if not pd.isna(cons):
                areas = Area.objects.filter(name=cons)
                areas = list(areas)

            if len(areas) == 0:
                print(f"no matching area for {cons}")
                continue

            for area in areas:
                try:
                    for col in self.cols:
                        area_data, created = AreaData.objects.get_or_create(
                            data_type=self.data_types[col],
                            area=area,
                            defaults={"data": row[col]},
                        )
                except Exception as e:
                    print(f"issue with {cons}: {e}")
                    break

        for data_type in self.data_types.values():
            average = (
                AreaData.objects.filter(data_type=data_type)
                .annotate(data_as_int=Cast("data", output_field=IntegerField()))
                .all()
                .aggregate(Avg("data_as_int"))
            )

            data_type.average = average["data_as_int__avg"]
            data_type.save()

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = self.get_dataframe()
        self.add_data_sets(df)
        self.process_data(df)
