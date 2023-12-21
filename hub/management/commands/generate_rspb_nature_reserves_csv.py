from time import sleep

from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from utils.mapit import (
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    MapIt,
    NotFoundException,
    RateLimitException,
)


class Command(BaseCommand):
    help = "Generate CSV file of RSPB nature reserves in each constituency"

    data_file = settings.BASE_DIR / "data" / "rspb_reserves_centroids.csv"
    out_file = settings.BASE_DIR / "data" / "rspb_reserves.csv"

    def get_dataframe(self):
        df = pd.read_csv(self.data_file, usecols=["Name", "xcoord", "ycoord"])
        df = df.rename(columns={"Name": "name", "xcoord": "lon", "ycoord": "lat"})
        df.name = df.name.str.title()
        return df

    def process_data(self, df):
        out = []
        if not self._quiet:
            self.stdout.write("Generating processed RSPB reserve file")
        for index, row in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            name = row["name"]
            lat = row["lat"]
            lon = row["lon"]

            if not pd.isna(lat) and not pd.isna(lon):
                try:
                    mapit = MapIt()
                    gss_codes = mapit.wgs84_point_to_gss_codes(lon, lat)

                except (
                    NotFoundException,
                    BadRequestException,
                    InternalServerErrorException,
                    ForbiddenException,
                ) as error:
                    print(f"Error fetching row {name} with {lat}, {lon}: {error}")
                    continue
                except RateLimitException as error:
                    print(f"Mapit Error - {error}, waiting for a minute")
                    sleep(60)
                    continue
            else:
                print(f"missing lat or lon for row {name}")
                continue
            out.append([name, ",".join(gss_codes)])

            if index > 0 and index % 50 == 0:
                sleep(10)

        out_df = pd.DataFrame(columns=["name", "gss"], data=out)
        return out_df

    def save_data(self, df):
        df.to_csv(self.out_file)

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = self.get_dataframe()
        out_df = self.process_data(df)
        self.save_data(out_df)
