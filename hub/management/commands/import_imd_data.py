from django.core.management.base import BaseCommand

import pandas as pd
from mysoc_dataset import get_dataset_url
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet, DataType


class Command(BaseCommand):
    help = "Import IMD and RUC data"

    packages = [
        {
            "repo_name": "composite_uk_imd",
            "package_name": "uk_index",
            "version_name": "3.0.0",
            "file_name": "constituency_imd.csv",
            "source": "https://mysociety.github.io/composite_uk_imd/",
            "name": "constituency_imd",
            "label": "Index of Multiple Deprivation",
            "type": "integer",
            "data_column": "pcon-imd-pop-quintile",
            "category": "place",
        },
        {
            "repo_name": "uk_ruc",
            "package_name": "uk_ruc",
            "version_name": "2.0.0",
            "file_name": "pcon_ruc.csv",
            "source": "https://mysociety.github.io/uk_ruc/",
            "name": "constituency_ruc",
            "label": "Urban Rural Classification",
            "type": "text",
            "data_column": "ruc-cluster-label",
            "category": "place",
        },
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def get_package_url(self, package) -> str:
        url = get_dataset_url(
            repo_name=package["repo_name"],
            package_name=package["package_name"],
            version_name=package["version_name"],
            file_name=package["file_name"],
            done_survey=True,
        )
        return url

    def handle(self, quiet: bool = False, *args, **options):
        self._quiet = quiet

        for package in self.packages:
            df = pd.read_csv(self.get_package_url(package))

            data_set, created = DataSet.objects.update_or_create(
                name=package["name"],
                defaults={
                    "data_type": package["type"],
                    "source": package["source"],
                    "label": package["label"],
                    "description": package["label"],
                    "category": package["category"],
                },
            )

            data_type, created = DataType.objects.update_or_create(
                data_set=data_set,
                name=package["name"],
                defaults={
                    "data_type": package["type"],
                    "label": package["label"],
                },
            )

            if not self._quiet:
                self.stdout.write(f"importing {package['label']}")
            for index, row in tqdm(
                df.iterrows(), disable=self._quiet, total=df.shape[0]
            ):
                gss = row["gss-code"]

                try:
                    area = Area.objects.get(gss=gss)
                except Area.DoesNotExist:
                    self.stdout.write(f"Failed to find area with code {gss}")
                    continue

                AreaData.objects.update_or_create(
                    data_type=data_type,
                    area=area,
                    defaults={"data": row[package["data_column"]]},
                )
