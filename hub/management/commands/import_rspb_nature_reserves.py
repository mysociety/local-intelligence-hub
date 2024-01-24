from django.conf import settings

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, AreaType, DataSet

from .base_importers import BaseAreaImportCommand


class Command(BaseAreaImportCommand):
    help = "Import data about RSPB reserves in each constituency"
    data_file = settings.BASE_DIR / "data" / "rspb_reserves.csv"
    defaults = {
        "label": "RSPB Reserves",
        "description": "Names of RSPB reserves in each constituency.",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "release_date": "September 2023",
        "source_label": "Data from the RSPB.",
        "source": "https://opendata-rspb.opendata.arcgis.com/datasets/6076715cb76d4c388fa38b87db7d9d24/explore",
        "source_type": "csv",
        "table": "areadata",
        "default_value": {},
        "is_filterable": False,
        "is_shadable": False,
        "comparators": DataSet.comparators_default(),
        "unit_type": "raw",
        "unit_distribution": "physical_area",
    }

    count_defaults = {
        "label": "Number of RSPB Reserves",
        "description": "Number of RSPB reserves in each constituency.",
        "data_type": "integer",
        "category": "place",
        "release_date": "September 2023",
        "source_label": "Data from the RSPB.",
        "source": "https://opendata-rspb.opendata.arcgis.com/datasets/6076715cb76d4c388fa38b87db7d9d24/explore",
        "source_type": "csv",
        "table": "areadata",
        "default_value": 0,
        "is_filterable": True,
        "is_shadable": True,
        "comparators": DataSet.numerical_comparators(),
    }

    data_sets = {
        "rspb_reserves": {
            "defaults": defaults,
        },
        "rspb_reserves_count": {
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
            self.stdout.write("Importing rspb reserves data")

        # Group by the area, and add the data from there
        for gss_list, data in tqdm(df.groupby("gss")):
            for gss in gss_list.split(","):
                try:
                    area = Area.objects.filter(
                        area_type=AreaType.objects.get(code="WMC")
                    ).get(gss=gss)
                except Area.DoesNotExist:
                    continue

                json = []
                for index, row in data.iterrows():
                    json.append({"group_name": row["name"]})

                json_data, created = AreaData.objects.update_or_create(
                    data_type=self.data_types["rspb_reserves"],
                    area=area,
                    json=json,
                )

                count_data, created = AreaData.objects.update_or_create(
                    data_type=self.data_types["rspb_reserves_count"],
                    area=area,
                    data=len(data),
                )

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )
