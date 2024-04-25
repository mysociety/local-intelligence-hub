from django.conf import settings

import pandas as pd

from .base_generators import BaseLatLonGeneratorCommand


class Command(BaseLatLonGeneratorCommand):
    help = "Generate a cleaned CSV file of the number of Save the Children shops per constituency"
    message = "Generating a CSV of areas for Save the Children shops"

    data_file = settings.BASE_DIR / "data" / "save_the_children_shops.csv"
    out_file = settings.BASE_DIR / "data" / "save_the_children_shops_processed.csv"

    uses_gss = True
    uses_postcodes = True
    row_name = "shop_code"

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

        df = df.dropna(subset="postcode")
        df.constituency = df.constituency.str.strip()
        df.postcode = df.postcode.str.strip()

        return df

    def get_location_from_row(self, row):
        return {"postcode": row.postcode}
