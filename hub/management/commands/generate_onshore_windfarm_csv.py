import re

from django.conf import settings

import pandas as pd

from .base_generators import BaseLatLonGeneratorCommand


class Command(BaseLatLonGeneratorCommand):
    help = "Generate CSV file of windfarms with constituency from wikipedia"
    message = "Generating a CSV of areas for onshore windfarms"

    url = (
        "https://en.wikipedia.org/wiki/List_of_onshore_wind_farms_in_the_United_Kingdom"
    )
    out_file = settings.BASE_DIR / "data" / "windfarms_per_constituency.csv"

    row_name = "Wind farm"
    legacy_col = "gss"
    uses_gss = True

    def get_dataframe(self):
        dfs = pd.read_html(self.url, match="Wind Farm", displayed_only=False)

        dfs = dfs[0:4]
        df = pd.concat(dfs)

        return df

    def get_location_from_row(self, row):
        _, _, decimal = row["Coordinates"].split("/")
        lat, lon = re.findall(r"[\-\d.]+", decimal)[0:2]

        return {"lat_lon": [lat, lon]}
