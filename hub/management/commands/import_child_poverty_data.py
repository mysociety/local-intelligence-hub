from django.db.models import FloatField

import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import data about child poverty"

    source_url = "https://endchildpoverty.org.uk/child-poverty/"
    data_url = "https://endchildpoverty.org.uk/wp-content/uploads/2022/07/Child-Poverty-AHC-estimates-2015-2021-FINAL.xlsx"

    cast_field = FloatField
    uses_gss = True
    cons_row = "Area Code"
    message = "Importing constituency child poverty data"
    data_sets = {
        "constituency_child_poverty": {
            "defaults": {
                "label": "Estimated child poverty",
                "description": "Percentage of children living in households with a net income (after housing costs) below 60% of the national median.",
                "release_date": "March 2022",
                "data_type": "percent",
                "category": "place",
                "source_label": "Data from End Child Poverty, based on data from DWP/HMRC.",
                "source": source_url,
                "source_type": "xlxs",
                "data_url": data_url,
                "table": "areadata",
                "fill_blanks": False,
                "comparators": DataSet.numerical_comparators(),
                "default_value": 10,
            },
            "col": "Percentage 2020/21",
        }
    }

    def delete_data(self):
        AreaData.objects.filter(
            data_type=self.data_types["constituency_child_poverty"]
        ).delete()

    def get_dataframe(self):
        df = pd.read_excel(
            self.data_url, sheet_name="Parliamentary Constituency", skiprows=1
        )
        df.columns = [
            "Region",
            "Parliamentary Constituency",
            "Area Code",
            "Number 2014/15",
            "Number 2015/16",
            "Number 2016/17",
            "Number 2017/18",
            "Number 2018/19",
            "Number 2019/20",
            "Number 2020/21",
            "Percentage 2014/15",
            "Percentage 2015/16",
            "Percentage 2016/17",
            "Percentage 2017/18",
            "Percentage 2018/19",
            "Percentage 2019/20",
            "Percentage 2020/21",
            "Percentage point change (2015-21)",
        ]
        percentage_columns = [col for col in df.columns if "Percentage" in col]
        for col in percentage_columns:
            df[col] = df[col] * 100
        return df
