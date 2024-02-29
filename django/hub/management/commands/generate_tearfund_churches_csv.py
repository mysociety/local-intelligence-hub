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

POSTCODE_REGEX = r"[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}"


class Command(BaseCommand):
    help = "Generate CSV file of churches which have declared a climate emergency"

    data_file = settings.BASE_DIR / "data" / "tearfund_churches.csv"
    out_file = settings.BASE_DIR / "data" / "tearfund_churches_processed.csv"

    def get_dataframe(self):
        df = pd.read_csv(self.data_file, usecols=["Church / Organisation", "Address"])
        # Remove first row, which just has the number of rows
        df = df.iloc[1:, :]
        df.columns = ["church", "address"]
        return df

    def get_gss_code(self, mapit, postcode):
        try:
            gss_code = mapit.postcode_point_to_gss_codes(postcode)
        except (
            NotFoundException,
            BadRequestException,
            InternalServerErrorException,
            ForbiddenException,
        ) as error:
            print(f"Error fetching row postcode: {postcode} - {error} raised")
            return None
        except RateLimitException as error:
            print(f"Mapit Error - {error}, waiting for a minute")
            sleep(60)
            return self.get_gss_code(mapit, postcode)
        return ",".join(gss_code)

    def get_all_gss_codes_from_mapit(self, df):
        df = df.copy()
        # Get postcodes from church and address cols
        df["church_regexed_postcode"] = df.church.str.findall(
            POSTCODE_REGEX, flags=re.IGNORECASE
        ).apply(lambda regex_list: regex_list[0] if regex_list != [] else None)
        df["address_regexed_postcode"] = (
            df.address.dropna()
            .str.findall(POSTCODE_REGEX, flags=re.IGNORECASE)
            .apply(lambda regex_list: regex_list[0] if regex_list != [] else None)
        )
        df["postcode"] = df.address_regexed_postcode.combine_first(
            df.church_regexed_postcode
        )

        gss_codes = []
        mapit = MapIt()
        for postcode in tqdm(df.postcode):
            gss_code = None
            if postcode:
                gss_code = self.get_gss_code(mapit, postcode)
            gss_codes.append(gss_code)

        return pd.Series(gss_codes, name="gss")

    def process_data(self, df):
        if not self._quiet:
            self.stdout.write("Generating churches per constituency data")

        gss_codes = self.get_all_gss_codes_from_mapit(df)
        df = pd.concat([df, gss_codes], axis=1)
        return df

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
