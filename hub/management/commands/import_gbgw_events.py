from time import sleep

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Avg, IntegerField
from django.db.models.functions import Cast

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet, DataType
from utils.mapit import (
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    MapIt,
    NotFoundException,
    RateLimitException,
)


class Command(BaseCommand):
    help = "Import data about number of GBGW events per constituency"

    data_file = settings.BASE_DIR / "data" / "gbgw_events.csv"
    column_map = {}
    data_types = {}

    def get_dataframe(self):
        df = pd.read_csv(self.data_file)
        df = df.dropna(axis="columns", how="all")

        return df

    def add_data_sets(self, df):
        data_set, created = DataSet.objects.update_or_create(
            name="constituency_gbgw_2022_event_count",
            defaults={
                "label": "Number of Great Big Green Week 2022 events",
                "description": "Number of Great Big Green Week 2022 events",
                "data_type": "integer",
                "category": "movement",
                "source_label": "The Climate Coalition",
                "source": "https://greatbiggreenweek.com/",
                "source_type": "google sheet",
                "data_url": "",
            },
        )

        data_type, created = DataType.objects.update_or_create(
            data_set=data_set,
            name="constituency_gbgw_2022_event_count",
            defaults={
                "data_type": "integer",
                "label": "Number of Great Big Green Week 2022 events",
                "description": "Number of Great Big Green Week 2022 events",
            },
        )

        self.data_type = data_type

    def process_data(self, df):
        AreaData.objects.filter(data_type=self.data_type).delete()

        if not self._quiet:
            self.stdout.write("Importing great big green week data")
        for index, row in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            lat = row["Latitude"]
            lon = row["Longitude"]

            if not pd.isna(lat) and not pd.isna(lon):
                try:
                    mapit = MapIt()
                    gss_codes = mapit.wgs84_point_to_gss_codes(lon, lat)

                    areas = Area.objects.filter(gss__in=gss_codes)
                    areas = list(areas)
                except (
                    NotFoundException,
                    BadRequestException,
                    InternalServerErrorException,
                    ForbiddenException,
                ) as error:
                    print(f"Error fetching row {index} with {lat}, {lon}: {error}")
                    continue
                except RateLimitException as error:
                    print(f"Mapit Error - {error}, waiting for a minute")
                    sleep(60)
            else:
                print(f"missing lat or lon for row {index}")
                continue

            for area in areas:
                area, created = AreaData.objects.get_or_create(
                    data_type=self.data_type,
                    area=area,
                )
                if created:
                    area.data = 1
                else:
                    area.data = area.value() + 1
                area.save()

            if index > 0 and index % 50 == 0:
                sleep(10)

        average = (
            AreaData.objects.filter(data_type=self.data_type)
            .annotate(data_as_int=Cast("data", output_field=IntegerField()))
            .all()
            .aggregate(Avg("data_as_int"))
        )

        self.data_type.average = average["data_as_int__avg"]
        self.data_type.save()

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = self.get_dataframe()
        self.add_data_sets(df)
        self.process_data(df)
