from django.conf import settings

import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import data about number of FOE supporters per constituency"

    data_file = settings.BASE_DIR / "data" / "foe_supporters.csv"
    cons_row = "constituency"
    message = "Importing FOE supporters data"
    uses_gss = False

    defaults = {
        "data_type": "integer",
        "category": "movement",
        "subcategory": "supporters_and_activists",
        "release_date": "November 2022",
        "source_label": "Data from Friends of the Earth.",
        "source": "https://friendsoftheearth.uk/",
        "source_type": "google sheet",
        "table": "areadata",
        "default_value": 10,
        "data_url": "",
        "comparators": DataSet.numerical_comparators(),
    }

    data_sets = {
        "constituency_foe_activists_count": {
            "defaults": defaults.extend(
                {
                    "description": "Number of Friends of the Earth activists per constituency."
                }
            ),
            "col": "activists",
        },
        "constituency_foe_supporters_count": {
            "defaults": defaults.extend(
                {
                    "description": "Number of Friends of the Earth supporters per constituency."
                }
            ),
            "col": "supporters",
        },
    }

    def get_dataframe(self):
        df = pd.read_csv(self.data_file, thousands=",")
        df = df.dropna(axis="columns", how="all")
        df = df.dropna(axis="rows", how="any")
        df.columns = ["constituency", "supporters", "activists"]
        df = df.astype({"supporters": int, "activists": int})

        return df

    def get_label(self, defaults):
        return f"Number of Friends of the Earth {defaults['col']}"

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types.values()).delete()
