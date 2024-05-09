import re

from django.conf import settings

import pandas as pd

from .base_generators import BaseLatLonGeneratorCommand

POSTCODE_REGEX = r"[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}"


class Command(BaseLatLonGeneratorCommand):
    help = "Generate CSV file of churches which have declared a climate emergency"
    message = "Generating a CSV of churches that have declared a climate emergency"

    data_file = settings.BASE_DIR / "data" / "tearfund_churches.csv"
    out_file = settings.BASE_DIR / "data" / "tearfund_churches_processed.csv"

    row_name = "church"
    uses_gss = True
    uses_postcodes = True

    def get_dataframe(self):
        df = pd.read_csv(self.data_file, usecols=["Church / Organisation", "Address"])
        # Remove first row, which just has the number of rows
        df = df.iloc[1:, :]
        df.columns = ["church", "address"]
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
        return df

    def get_location_from_row(self, row):
        return {"postcode": row.postcode}
