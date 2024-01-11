from datetime import date

from django.conf import settings

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, AreaType, DataSet

from .base_importers import BaseAreaImportCommand


class Command(BaseAreaImportCommand):
    help = "Import data about wildlife trust reserves in each constituency"
    data_file = settings.BASE_DIR / "data" / "wildlife_trust_reserves.csv"
    defaults = {
        "label": "Wildlife Trusts Reserves",
        "description": "Names of Wildlife Trusts reserves in each constituency.",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "release_date": str(date.today()),
        "source_label": "Data from the Wildlife Trusts.",
        "source": "https://www.wildlifetrusts.org/",
        "source_type": "api",
        "data_url": "https://www.wildlifetrusts.org/jsonapi/node/reserve",
        "table": "areadata",
        "default_value": {},
        "is_filterable": False,
        "is_shadable": False,
        "comparators": DataSet.comparators_default(),
    }

    count_defaults = {
        "label": "Number of Wildlife Trusts Reserves",
        "description": "Number of Wildlife Trusts reserves in each constituency.",
        "data_type": "integer",
        "category": "place",
        "release_date": str(date.today()),
        "source_label": "Data from the Wildlife Trusts.",
        "source": "https://www.wildlifetrusts.org/",
        "source_type": "api",
        "table": "areadata",
        "data_url": "https://www.wildlifetrusts.org/jsonapi/node/reserve",
        "default_value": 0,
        "is_filterable": True,
        "is_shadable": True,
        "comparators": DataSet.numerical_comparators(),
    }

    data_sets = {
        "wildlife_trusts_reserves": {
            "defaults": defaults,
        },
        "wildlife_trusts_reserves_count": {
            "defaults": count_defaults,
        },
    }

    def handle(self, quiet=False, *args, **kwargs):
        self._quiet = quiet
        self.add_data_sets()
        self.delete_data()
        self.process_data()
        self.update_max_min()

    def process_data(self):
        df = pd.read_csv(self.data_file)

        if not self._quiet:
            self.stdout.write("Importing wildlife trusts reserves data")

        # Group by the area, and add the data from there
        for gss, data in tqdm(df.groupby("gss")):
            try:
                area = Area.objects.filter(
                    area_type=AreaType.objects.get(code="WMC")
                ).get(gss=gss)
            except Area.DoesNotExist:
                continue

            json = []
            for index, row in data.iterrows():
                json.append(
                    row[["title", "url"]]
                    .rename({"title": "group_name"})
                    .dropna()
                    .to_dict()
                )

            json_data, created = AreaData.objects.update_or_create(
                data_type=self.data_types["wildlife_trusts_reserves"],
                area=area,
                json=json,
            )

            count_data, created = AreaData.objects.update_or_create(
                data_type=self.data_types["wildlife_trusts_reserves_count"],
                area=area,
                data=len(data),
            )

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )
