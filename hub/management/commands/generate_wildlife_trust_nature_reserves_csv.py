import re

from django.conf import settings

import pandas as pd
import requests

from .base_generators import BaseLatLonGeneratorCommand

DATA_URL = "https://www.wildlifetrusts.org/jsonapi/node/reserve"
POSTCODE_REGEX = r"[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}"


class Command(BaseLatLonGeneratorCommand):
    help = "Generate CSV file of wildlife trust nature reserves"
    message = "Generating a CSV of areas for wildlife trust nature reserves"

    out_file = settings.BASE_DIR / "data" / "wildlife_trust_reserves.csv"

    row_name = "title"
    uses_gss = True
    legacy_col = "gss"
    uses_postcodes = True

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

    def get_location_from_row(self, row):
        return {"postcode": row["postcode"]}

    def process_data(self, df):
        df = super().process_data(df)
        df = df.drop_duplicates(subset=["title", "gss"])
        return df
