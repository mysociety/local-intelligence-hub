import re
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
    help = "Generate CSV file of windfarms with constituency from wikipedia"

    url = (
        "https://en.wikipedia.org/wiki/List_of_onshore_wind_farms_in_the_United_Kingdom"
    )
    out_file = settings.BASE_DIR / "data" / "windfarms_per_constituency.csv"

    def get_dataframe(self):
        dfs = pd.read_html(self.url, match="Wind Farm", displayed_only=False)

        dfs = dfs[0:4]
        df = pd.concat(dfs)

        return df

    def process_data(self, df):
        if not self._quiet:
            self.stdout.write("Turning wikipedia data in cons")

        out = []

        for index, row in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            _, _, decimal = row["Coordinates"].split("/")
            lat, lon = re.findall(r"[\-\d.]+", decimal)[0:2]

            name = row["Wind farm"]

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
                    return None
                except RateLimitException as error:
                    print(f"Mapit Error - {error}, waiting for a minute")
                    sleep(60)
                    return False
            else:
                print(f"missing lat or lon for row {name}")
                return None

            out.append([name, ",".join(gss_codes), row["Cap. (MW)"]])

            if index > 0 and index % 50 == 0:
                sleep(10)

        out_df = pd.DataFrame(columns=["name", "gss", "capacity"], data=out)
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
