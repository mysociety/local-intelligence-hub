from django.conf import settings

import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import Brexit voting data"

    cons_row = "constituency"
    message = "Importing constituency Brexit voting data"
    uses_gss = False
    data_file = settings.BASE_DIR / "data" / "brexit.xlsx"
    data_sets = {
        "brexit_votes": {
            "defaults": {
                "label": "EU (Brexit) leave vote percentage",
                "description": "Percentage of constituents who voted to leave the EU in the 2016 referendum",
                "data_type": "percent",
                "category": "opinion",
                "source_label": "UK Parliament",
                "source": "https://commonslibrary.parliament.uk/brexit-votes-by-constituency/",
                "source_type": "xlxs",
                "table": "areadata",
                "is_filterable": True,
                "comparators": DataSet.numerical_comparators(),
            },
            "col": "leave_percent",
        }
    }

    def get_dataframe(self):
        df = pd.read_excel(
            self.data_file,
            sheet_name=1,
            usecols=[2, 6],
            names=["constituency", "leave_percent"],
            skiprows=7,
            converters={"leave_percent": lambda x: round(x * 100)},
        )
        df.constituency = df.constituency.str.replace("Ynys Mon", "Ynys Môn")
        return df

    def delete_data(self):
        AreaData.objects.filter(data_type__name="brexit_votes").delete()
