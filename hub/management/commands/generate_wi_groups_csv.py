import re

from django.conf import settings

import pandas as pd
import requests

from .base_generators import BaseLatLonGeneratorCommand

GROUPS_URL = "https://wi-search.squiz.cloud/s/search.json?collection=nfwi-federations&profile=_default&query=!null&sort=prox&sort=prox&start_rank=1&origin=54.093409,-2.89479&maxdist=9999&num_ranks=9999"


class Command(BaseLatLonGeneratorCommand):
    help = "Generate CSV file of WI Groups'"
    message = "Generating a CSV of areas for WI groups"

    row_name = "group_name"
    uses_gss = True

    out_file = settings.BASE_DIR / "data" / "wi_groups.csv"

    def get_dataframe(self):
        if not self._quiet:
            self.stdout.write("Downloading data from API")
        results = requests.get(GROUPS_URL)
        data = results.json()["response"]["resultPacket"]["results"]

        df = pd.DataFrame.from_records(data)
        df["lat_lon"] = df.metaData.str["x"]

        df = df[["title", "liveUrl", "lat_lon"]]
        df.columns = ["group_name", "url", "lat_lon"]
        return df

    def get_location_from_row(self, row):
        try:
            lat, lon = re.split(r"[,;]", row.lat_lon)
        except ValueError:
            print(f"bad lat_lon for row {row[self.row_name]}")
            return None

        return {"lat_lon": [lat, lon]}
