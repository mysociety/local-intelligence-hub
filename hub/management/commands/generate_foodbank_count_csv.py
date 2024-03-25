import json

from django.conf import settings

import pandas as pd

from .base_generators import BaseLatLonGeneratorCommand


class Command(BaseLatLonGeneratorCommand):
    help = "Generate CSV file of foodbanks with constituency from trussell trust"
    message = "Generating a CSV of areas for foodbanks"

    data_file = (
        settings.BASE_DIR / "data" / "trussell-trust-foodbank-groups-and-branches.json"
    )
    out_file = settings.BASE_DIR / "data" / "foodbanks_per_constituency.csv"

    uses_gss = True
    legacy_col = "gss"
    row_name = "name"

    def get_dataframe(self):
        out_data = []
        with open(self.data_file) as f:
            data = json.load(f)
        for area in data:
            if area["foodbank_centre"]:
                for foodbank in area["foodbank_centre"]:
                    location = foodbank["centre_geolocation"]
                    out_data.append(
                        [
                            foodbank.get(
                                "foodbank_name", area["foodbank_information"]["name"]
                            ),
                            location["lat"],
                            location["lng"],
                        ]
                    )
            else:
                info = area["foodbank_information"]
                out_data.append(
                    [
                        info["name"],
                        info["geolocation"]["lat"],
                        info["geolocation"]["lng"],
                    ]
                )

        df = pd.DataFrame(columns=["name", "lat", "lon"], data=out_data)
        return df
