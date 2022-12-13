from django.conf import settings

import pandas as pd

from hub.models import AreaData

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import data labeling constituencies as red of blue wall"

    data_file = settings.BASE_DIR / "data" / "red_blue_wall_constituencies.csv"
    cons_row = "constituency"
    message = "Importing red and blue wall constituencies"
    uses_gss = False

    defaults = {
        "label": "Red or Blue Wall Constituency",
        "data_type": "text",
        "category": "place",
        "source_label": "Green Alliance",
        "source": "https://green-alliance.org.uk/",
        "source_type": "google sheet",
        "table": "areadata",
        "options": [
            dict(title="Red Wall", shader="red"),
            dict(title="Blue Wall", shader="blue"),
        ],
        "data_url": "",
    }

    data_sets = {
        "constituency_red_blue_wall": {
            "defaults": defaults,
        },
    }

    def get_dataframe(self):
        df = pd.read_csv(self.data_file, thousands=",")
        df = df.dropna(axis="columns", how="all")
        df = df.dropna(thresh=3)
        df.columns = ["mp", "constituency", "red_wall", "blue_wall"]

        return df

    def get_row_data(self, row, conf):
        if row["red_wall"] == "x":
            return "Red Wall"
        elif row["blue_wall"] == "x":
            return "Blue Wall"

        return ""

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types.values()).delete()
