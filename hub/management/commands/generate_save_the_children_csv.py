from time import sleep

from django.conf import settings
from django.core.management.base import BaseCommand

from hub.models import Area

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
    help = "Generate a cleaned CSV file of the number of Save the Children shops per constituency"

    data_file = settings.BASE_DIR / "data" / "save_the_children_shops.csv"
    out_file = settings.BASE_DIR / "data" / "save_the_children_shops_processed.csv"

    def get_dataframe(self):
        df = pd.read_csv(
            self.data_file,
            usecols=[
                "Shop Code",
                "Shop Address 1",
                "Shop Address 2",
                "Shop Address 3",
                "Shop Address 4",
                "Postcode",
                "Constituency ",
            ],
        )
        df.columns = [
            "shop_code",
            "shop_address_1",
            "shop_address_2",
            "shop_address_3",
            "shop_address_4",
            "postcode",
            "constituency",
        ]
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
            print(f"Error fetching row postcode: '{postcode}' - Error: {error}")
            return None
        except RateLimitException as error:
            print(f"Mapit Error - {error}, waiting for a minute")
            sleep(60)
            return self.get_gss_code(mapit, postcode)
        return ",".join(gss_code)

    def process_data(self, df):
        if not self._quiet:
            self.stdout.write("Generating foodbank per constituency data")

        df = df.dropna(subset="postcode")
        df.constituency = df.constituency.str.strip()
        df.postcode = df.postcode.str.strip()

        mapit = MapIt()
        gss = []
        for index, row in tqdm(df.iterrows()):
            area = []
            # If the constituency isn't null
            if type(row.constituency) == str:
                area = Area.objects.filter(name__iexact=row.constituency)

            if len(area) != 0:
                gss.append(area[0].gss)
            else:
                # If the constituency doesn't work, use MapIt to enter the GSS code instead
                gss.append(self.get_gss_code(mapit, row.postcode))

        df["gss"] = gss
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
