from django.conf import settings

import pandas as pd

from .base_generators import BaseLatLonGeneratorCommand


class Command(BaseLatLonGeneratorCommand):
    help = "Generate CSV file of RSPB nature reserves in each constituency"
    message = "Generating a CSV of areas for RSPB nature reserves"

    data_file = settings.BASE_DIR / "data" / "rspb_reserves_centroids.csv"
    out_file = settings.BASE_DIR / "data" / "rspb_reserves.csv"

    uses_gss = True
    row_name = "name"
    legacy_col = "gss"

    def get_dataframe(self):
        df = pd.read_csv(self.data_file, usecols=["Name", "xcoord", "ycoord"])
        df = df.rename(columns={"Name": "name", "xcoord": "lon", "ycoord": "lat"})
        df.name = df.name.str.title()
        return df
