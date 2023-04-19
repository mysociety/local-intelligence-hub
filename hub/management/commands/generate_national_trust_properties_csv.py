import json
from time import sleep

from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area
from utils.mapit import (
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    MapIt,
    NotFoundException,
    RateLimitException,
)


class Command(BaseCommand):
    help = "Generate CSV file of National Trust Properties from JSON"
    tqdm.pandas()

    in_file = settings.BASE_DIR / "data" / "national_trust_properties.json"
    out_file = settings.BASE_DIR / "data" / "national_trust_properties.csv"

    def get_dataframe(self):
        with open(self.in_file) as f:
            data = json.load(f)

        properties = []
        for feature in data["features"]:
            p = feature["properties"]
            properties.append(
                {
                    "name": p["Property_N"],
                    "lat_lon": f"{p['POINT_X']},{p['POINT_Y']}",
                    "lat": p["POINT_Y"],
                    "lon": p["POINT_X"],
                    "area": "",
                }
            )

        df = pd.DataFrame.from_records(properties)

        return df

    def _process_lat_long(self, lat=None, lon=None, row_name=None):

        if not pd.isna(lat) and not pd.isna(lon):
            try:
                mapit = MapIt()
                gss_codes = mapit.wgs84_point_to_gss_codes(lon, lat)

                area = Area.objects.filter(gss__in=gss_codes).first()
                if area:
                    return area.name
                else:
                    return None
            except (
                NotFoundException,
                BadRequestException,
                InternalServerErrorException,
                ForbiddenException,
            ) as error:
                print(f"Error fetching row {row_name} with {lat}, {lon}: {error}")
                return None
            except RateLimitException as error:
                print(f"Mapit Error - {error}, waiting for a minute")
                sleep(60)
                return False
        else:
            print(f"missing lat or lon for row {row_name}")
            return None

    def process_lat_long(self, lat=None, lon=None, row_name=None):
        success = self._process_lat_long(lat=lat, lon=lon, row_name=row_name)
        # retry once if it fails so we can catch rate limit errors
        if success is False:
            return self._process_lat_long(lat=lat, lon=lon, row_name=row_name)
        else:
            return success

    def process_data(self, df):
        if not self._quiet:
            self.stdout.write("Generating GSS codes from lat + lon values")
        if not self._ignore:
            # Download existing csv, if it exists, so that data isn't updated redundantly
            try:
                old_df = pd.read_csv(
                    self.out_file, usecols=["lat_lon", "lat", "lon", "area"]
                )
                lat_long_lookup = {
                    row.lat_lon: row.area for index, row in old_df.iterrows()
                }
                if not self._quiet:
                    self.stdout.write("Reading codes from existing file")
                df["area"] = df.apply(
                    lambda row: lat_long_lookup.get((row.lat_lon), None), axis=1
                )
            except FileNotFoundError:
                print("No existing file.")

        if not self._quiet:
            self.stdout.write("Generating GSS codes for new national trust properties")

        df["area"] = df.progress_apply(
            lambda row: self.process_lat_long(row.lat, row.lon, row.name)
            if pd.isna(row.area)
            else row.area,
            axis=1,
        )
        return df

    def save_data(self, df):
        df.to_csv(self.out_file, index=False)

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )
        parser.add_argument(
            "-i", "--ignore", action="store_true", help="Ignore existing data file"
        )

    def handle(self, quiet=False, ignore=False, *args, **options):
        self._quiet = quiet
        self._ignore = ignore
        df = self.get_dataframe()
        out_df = self.process_data(df)
        self.save_data(out_df)
