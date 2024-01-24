from time import sleep

from django.conf import settings

import pandas as pd
from tqdm import tqdm

from hub.models import AreaData, DataSet, DataType

from .base_importers import BaseLatLongImportCommand


class Command(BaseLatLongImportCommand):
    help = "Import data about number of GBGW events in 2023 per constituency"

    data_file = settings.BASE_DIR / "data" / "gbgw_events_23.csv"
    column_map = {}
    data_types = {}

    def get_dataframe(self):
        df = pd.read_csv(self.data_file)
        df = df.dropna(axis="columns", how="all")

        return df

    def add_data_sets(self, df):
        data_set, created = DataSet.objects.update_or_create(
            name="constituency_gbgw_2023_event_count",
            defaults={
                "label": "Number of Great Big Green Week 2023 events",
                "description": "Number of Great Big Green Week 2023 events per constituency.",
                "release_date": "July 2023",
                "data_type": "integer",
                "category": "movement",
                "subcategory": "events",
                "source_label": "Data from The Climate Coalition.",
                "source": "https://greatbiggreenweek.com/",
                "source_type": "google sheet",
                "data_url": "",
                "table": "areadata",
                "default_value": 10,
                "comparators": DataSet.numerical_comparators(),
                "unit_type": "raw",
                "unit_distribution": "people_in_area",
            },
        )

        data_type, created = DataType.objects.update_or_create(
            data_set=data_set,
            name="constituency_gbgw_2023_event_count",
            defaults={
                "data_type": "integer",
                "label": "Number of Great Big Green Week 2023 events",
                "description": "Number of Great Big Green Week 2023 events per constituency.",
            },
        )

        self.data_type = data_type
        self.data_types[data_type.name] = data_type

    def process_data(self, df):
        AreaData.objects.filter(data_type=self.data_type).delete()

        if not self._quiet:
            self.stdout.write("Importing great big green week data")
        for index, row in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            lat = row["Lat"]
            lon = row["Long"]

            self.process_lat_long(lat=lat, lon=lon, row_name=index)

            if index > 0 and index % 50 == 0:
                sleep(10)

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = self.get_dataframe()
        self.add_data_sets(df)
        self.process_data(df)
        self.update_averages()
        self.update_max_min()
