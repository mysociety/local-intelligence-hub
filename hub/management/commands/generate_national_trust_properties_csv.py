import json

from django.conf import settings

import pandas as pd

from .base_generators import BaseLatLonGeneratorCommand


class Command(BaseLatLonGeneratorCommand):
    help = "Generate CSV file of National Trust Properties from JSON"
    message = "Generating a CSV of areas for NT properties"

    in_file = settings.BASE_DIR / "data" / "national_trust_properties.json"
    out_file = settings.BASE_DIR / "data" / "national_trust_properties.csv"

    row_name = "name"

    def get_dataframe(self):
        with open(self.in_file) as f:
            data = json.load(f)

        properties = []
        for feature in data["features"]:
            p = feature["properties"]
            properties.append(
                {
                    "name": p["Property_N"],
                    "lat_lon": f"{p['POINT_X']},{p['POINT_Y']}",
                    "lat": p["POINT_Y"],
                    "lon": p["POINT_X"],
                }
            )

        df = pd.DataFrame.from_records(properties)

        return df
