from django.db.models import FloatField

import pandas as pd

from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import data about area fuel poverty"

    source_url = (
        "https://www.gov.uk/government/statistics/sub-regional-fuel-poverty-data-2022"
    )
    data_url = "https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1081191/sub-regional-fuel-poverty-2022-tables.xlsx"

    cast_field = FloatField
    cons_row = "Parliamentary Constituency Code"
    message = "Importing constituency fuel poverty data"
    data_sets = {
        "constituency_fuel_poverty": {
            "defaults": {
                "label": "Households in Fuel Poverty",
                "description": "Percentage of Households in Fuel Poverty",
                "data_type": "percent",
                "category": "place",
                "source_label": "Department for Business, Energy & Industrial Strategy",
                "source": source_url,
                "source_type": "xlxs",
                "data_url": data_url,
                "table": "areadata",
                "comparators": DataSet.numerical_comparators(),
                "default_value": 10,
            },
            "col": "Proportion of households fuel poor (%)",
        }
    }

    def get_dataframe(self):
        df = pd.read_excel(self.data_url, sheet_name="Table 4", skiprows=2)
        df = df.dropna(axis="index", how="any")

        return df
