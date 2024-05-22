from django.conf import settings

import pandas as pd
import requests
from bs4 import BeautifulSoup

from .base_generators import BaseLatLonGeneratorCommand

POSTCODES_URL = (
    "http://www.google.com/maps/d/kml?forcekml=1&mid=15b_tQI0t58rLcBTgFytu2e73jyKrrxFr"
)


class Command(BaseLatLonGeneratorCommand):
    help = "Generate CSV file of Aid Alliance's 'power postcodes'"
    message = "Generating a CSV of areas for aid alliance power postcodes"

    out_file = settings.BASE_DIR / "data" / "aid_alliance_power_postcodes.csv"

    row_name = "name"
    uses_gss = True
    legacy_col = "gss"
    uses_postcodes = True

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

    def get_location_from_row(self, row):
        return {"postcode": row["postcode"]}
