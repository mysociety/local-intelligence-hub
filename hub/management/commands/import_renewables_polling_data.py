import re
from collections import defaultdict

from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet, DataType


class Command(BaseCommand):
    help = "Import polling data about support for renewables"

    data_url = "https://cdn.survation.com/wp-content/uploads/2022/09/06213145/RenewableUK-MRP-Constituency-Topline-.xlsx"
    data_file = settings.BASE_DIR / "data" / "renewables_polling.csv"
    column_map = {}
    data_types = {}

    def make_label_from_question(self, q):
        q = re.sub(r"[\d.]+\) ", "", q)
        q = re.sub(r"Percentage of (?:the )?constituency (?:who|that) (?:are )?", "", q)
        q = q.replace(" as energy generation", "")
        q = re.sub(r"(\w)", lambda w: w.group().upper(), q, 1)

        return q

    def get_dataframe(self):
        df = pd.read_excel(self.data_url)
        df = df.dropna(axis="columns", how="all")

        old_columns = df.columns
        df.columns = (
            "id-name",
            "gss",
            "constituency-name",
            "would-change-party",
            "less-favourable-conservative-weaken-climate",
            "prefer-conservative-leader-invest-renewables",
            "support-offshore-wind",
            "support-onshore-wind",
            "support-solar",
            "support-tidal",
            "support-wave",
            "support-nuclear",
            "support-local-renewable",
            "believe-gov-renewable-invest-increase",
            "believe-gov-renewable-should-invest",
            "believe-block-onshore-wind",
        )

        for key, value in zip(df.columns, old_columns):
            self.column_map[key] = value

        return df

    def add_data_sets(self, df):
        order = 1
        for column in df.columns:
            if column in ("id-name", "gss", "constituency-name"):
                continue

            label = self.make_label_from_question(self.column_map[column])
            description = self.column_map[column]

            data_set, created = DataSet.objects.update_or_create(
                name=column,
                defaults={
                    "label": label,
                    "description": description,
                    "data_type": "percent",
                    "category": "opinion",
                    "source_label": "Survation, commissioned by RenewableUK",
                    "source": "https://www.renewableuk.com/news/615931/Polling-in-every-constituency-in-Britain-shows-strong-support-for-wind-farms-to-drive-down-bills.htm",
                    "source_type": "google sheet",
                    "data_url": "",
                    "order": order,
                    "table": "areadata",
                    "default_value": 50,
                    "comparators": DataSet.numerical_comparators(),
                },
            )

            data_type, created = DataType.objects.update_or_create(
                data_set=data_set,
                name=column,
                defaults={
                    "data_type": "percent",
                    "label": label,
                    "description": description,
                },
            )

            order += 1

            self.data_types[column] = data_type

    def process_data(self, df):
        count = 0
        totals = defaultdict(int)

        if not self._quiet:
            self.stdout.write("Importing polling data")
        for index, row in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            gss = row["gss"]

            try:
                area = Area.objects.get(gss=gss)
            except Area.DoesNotExist:
                self.stdout.write(f"Failed to find area with code {gss}")
                continue

            count += 1

            for column, data_type in self.data_types.items():

                totals[column] += float(row[column])

                AreaData.objects.update_or_create(
                    data_type=data_type,
                    area=area,
                    defaults={"data": row[column]},
                )

        for column, data_type in self.data_types.items():
            average = totals[column] / count
            data_type.average = average
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
