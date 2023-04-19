from django.db.models import FloatField

import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(
    BaseImportFromDataFrameCommand
):  # TODO: Should this have a value that isn't 0?
    help = "Import data about area fuel poverty"

    ignore_blank_entries = True
    source_url = (
        "https://www.gov.uk/government/statistics/sub-regional-fuel-poverty-data-2022"
    )
    data_url = "https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1081191/sub-regional-fuel-poverty-2022-tables.xlsx"

    source_date = "2020"

    cast_field = FloatField
    cons_row = "Parliamentary Constituency Code"
    message = "Importing constituency fuel poverty data"
    data_sets = {
        "constituency_fuel_poverty": {
            "defaults": {
                "label": "Households in fuel poverty",
                "description": "Percentage of households in fuel poverty",
                "data_type": "percent",
                "category": "place",
                "source_label": "Department for Business, Energy & Industrial Strategy",
                "source_date": source_date,
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

    def delete_data(self):
        AreaData.objects.filter(
            data_type=self.data_types["constituency_fuel_poverty"]
        ).delete()

    def get_dataframe(self):
        df = pd.read_excel(self.data_url, sheet_name="Table 4", skiprows=2)
        df = df.dropna(axis="index", how="any")

        return df
