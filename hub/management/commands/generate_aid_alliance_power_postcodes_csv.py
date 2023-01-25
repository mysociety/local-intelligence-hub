from time import sleep

from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

from utils.mapit import (
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    MapIt,
    NotFoundException,
    RateLimitException,
)

POSTCODES_URL = (
    "http://www.google.com/maps/d/kml?forcekml=1&mid=15b_tQI0t58rLcBTgFytu2e73jyKrrxFr"
)


class Command(BaseCommand):
    help = "Generate CSV file of Aid Alliance's 'power postcodes'"

    out_file = settings.BASE_DIR / "data" / "aid_alliance_power_postcodes.csv"

    def get_dataframe(self):
        response = requests.get(POSTCODES_URL)
        soup = BeautifulSoup(response.content, "xml")
        # Get only the power postcodes
        soup = soup.find(text="Power Postcodes Community Groups").find_parents(limit=2)[
            1
        ]
        placemarks = soup.find_all("Placemark")

        power_postcode_data = []
        for placemark in placemarks:
            name = placemark.find("name").text
            data = placemark.ExtendedData.find_all("Data")
            data_dict = {"name": name}
            data_dict.update({datum["name"]: datum.value.text for datum in data})
            power_postcode_data.append(data_dict)

        df = pd.DataFrame.from_records(power_postcode_data).dropna(subset="Postcode")
        df.columns = df.columns.str.lower().str.replace(" ", "_").str.replace("'", "")
        df = df.applymap(str.strip)
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
            self.stdout.write("Generating GSS codes from postcodes")

        gss_codes = self.get_all_gss_codes_from_mapit(df)
        df = pd.concat([df, gss_codes], axis=1)
        return df

    def save_data(self, df):
        df.to_csv(self.out_file, index=False)

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = self.get_dataframe()
        out_df = self.process_data(df)
        self.save_data(out_df)
