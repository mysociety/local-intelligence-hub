import re
from time import sleep

from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
import requests
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

DATA_URL = "https://www.wildlifetrusts.org/jsonapi/node/reserve"
POSTCODE_REGEX = r"[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}"


class Command(BaseCommand):
    help = "Generate CSV file of wildlife trust nature reserves"
    tqdm.pandas()

    out_file = settings.BASE_DIR / "data" / "wildlife_trust_reserves.csv"

    con_gss_codes = list(
        set([value["gss"] for value in list(Area.objects.values("gss"))])
    )

    def get_dataframe(self):
        if not self._quiet:
            self.stdout.write("Downloading data from API")
        data = []
        url = DATA_URL
        results = requests.get(url).json()
        while "next" in results["links"]:
            data.extend([d["attributes"] for d in results["data"]])
            url = results["links"]["next"]["href"]
            results = requests.get(url).json()

        df = pd.DataFrame(data)[
            ["title", "trust_name", "rh_redirect", "field_reserve_postcode"]
        ]
        df = df.rename(
            columns={"field_reserve_postcode": "postcode", "rh_redirect": "url"}
        )
        # Where there is no url, a string is provided, that will break things
        df.url = df.url.apply(
            lambda x: None if x == "[node:field_external_link:uri]" else x
        )
        df["postcode"] = (
            df.postcode.dropna()
            .str.findall(POSTCODE_REGEX, flags=re.IGNORECASE)
            .apply(lambda regex_list: regex_list[0] if regex_list != [] else None)
        )
        df = df.dropna(subset=["postcode"])
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
        if gss_code:
            for code in gss_code:
                if code in self.con_gss_codes:
                    return code

    def process_data(self, df):
        if not self._quiet:
            self.stdout.write("Generating GSS codes from postcodes")
        mapit = MapIt()
        df["gss"] = df.postcode.apply(lambda pc: self.get_gss_code(mapit, pc))
        df = df.drop_duplicates(subset=["title", "gss"])
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
