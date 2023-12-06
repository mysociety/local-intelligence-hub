from django.conf import settings

import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import data about number of FOE groups per constituency"

    data_file = settings.BASE_DIR / "data" / "foe_groups.csv"
    cons_row = "constituency"
    message = "Importing FOE groups count data"
    uses_gss = False

    defaults = {
        "data_type": "integer",
        "category": "movement",
        "subcategory": "groups",
        "description": "Number of Friends of the Earth groups per constituency.",
        "release_date": "Novemeber 2022",
        "source_label": "Data from Friends of the Earth.",
        "source": "https://friendsoftheearth.uk/",
        "source_type": "google sheet",
        "table": "areadata",
        "default_value": 10,
        "data_url": "",
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    }

    data_sets = {
        "constituency_foe_groups_count": {
            "defaults": defaults,
            "col": "groups",
        },
    }

    def get_dataframe(self):
        df = pd.read_csv(
            self.data_file,
            usecols=["Westminster constituency", "Groups located within constituency"],
        )
        df = df.dropna()
        df = df.groupby("Westminster constituency").size().reset_index()
        df.columns = ["constituency", "groups"]
        df.groups = df.groups.astype(int)
        return df

    def get_label(self, defaults):
        return "Number of active Friends of the Earth groups"

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types.values()).delete()
