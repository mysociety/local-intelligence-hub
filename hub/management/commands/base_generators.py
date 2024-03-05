from time import sleep

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


class BaseLatLonGeneratorCommand(BaseCommand):
    tqdm.pandas()

    def get_dataframe(self):
        df = pd.read_csv(self.data_file)
        df = df.dropna(axis="columns", how="all")

        return df

    def _process_lat_long(self, lat_lon=None, row_name=None):
        lat = lat_lon[0]
        lon = lat_lon[1]

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

    def process_lat_long(self, lat_lon=None, row_name=None):
        success = self._process_lat_long(lat_lon=lat_lon, row_name=row_name)
        # retry once if it fails so we can catch rate limit errors
        if success is False:
            return self._process_lat_long(lat_lon=lat_lon, row_name=row_name)
        else:
            return success

    def process_data(self, df):
        if not self._quiet:
            self.stdout.write("Generating Area name from lat + lon values")

        df["area"] = df.progress_apply(
            lambda row: self.process_lat_long(
                self.get_lat_lon_from_row(row), row[self.row_name]
            ),
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
