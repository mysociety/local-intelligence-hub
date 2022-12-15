import json
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
    help = "Generate CSV file of foodbanks with constituency from trussell trust"

    data_file = (
        settings.BASE_DIR / "data" / "trussell-trust-foodbank-groups-and-branches.json"
    )
    out_file = settings.BASE_DIR / "data" / "foodbanks_per_constituency.csv"

    def get_dataframe(self):
        out_data = []
        with open(self.data_file) as f:
            data = json.load(f)
        for area in data:
            if area["foodbank_centre"]:
                for foodbank in area["foodbank_centre"]:
                    location = foodbank["centre_geolocation"]
                    out_data.append(
                        [
                            foodbank.get(
                                "foodbank_name", area["foodbank_information"]["name"]
                            ),
                            location["lat"],
                            location["lng"],
                        ]
                    )
            else:
                info = area["foodbank_information"]
                out_data.append(
                    [
                        info["name"],
                        info["geolocation"]["lat"],
                        info["geolocation"]["lng"],
                    ]
                )

        df = pd.DataFrame(columns=["name", "lat", "lon"], data=out_data)
        return df

    def process_data(self, df):
        if not self._quiet:
            self.stdout.write("Generating foodbank per constituency data")

        out = []

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
