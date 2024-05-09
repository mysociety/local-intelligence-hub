from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import DataSet


class Command(BaseCommand):
    help = "Generate CSV file of all datasets in the site."

    out_file = settings.BASE_DIR / "data" / "dataset_list.csv"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = self.build_dataframe()
        df.to_csv(self.out_file)

    def build_dataframe(self):
        # Next, iterate through each (filterable) data set in the db
        datasets = []
        for data_set in tqdm(
            DataSet.objects.filter().order_by("-category", "source"),
            disable=self._quiet,
        ):
            areas_available = [a.code for a in data_set.areas_available.all()]

            datasets.append(
                [
                    data_set.label,
                    data_set.description,
                    data_set.source,
                    data_set.category,
                    data_set.is_public,
                    "WMC" in areas_available,
                    "WMC23" in areas_available,
                    "STC" in areas_available,
                    "DIS" in areas_available,
                ]
            )

        df = pd.DataFrame(
            datasets,
            columns=[
                "Name",
                "Description",
                "Source",
                "Category",
                "Public",
                "2010 Cons",
                "2024 Cons",
                "Single Tier Councils",
                "District Councils",
            ],
        )
        return df
