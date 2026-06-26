from django.db.models import FloatField

import pandas as pd

from hub.import_utils import filter_authority_type
from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin

DATA_FILE = "data/Child-poverty-AHC-2015-2024_final.xlsx"
SOURCE_URL = "https://endchildpoverty.org.uk/child-poverty-2025/"

YEARS = [
    "2014/15",
    "2015/16",
    "2016/17",
    "2017/18",
    "2018/19",
    "2019/20",
    "2020/21",
    "2021/22",
    "2022/23",
    "2023/24",
]

CONSTITUENCY_COLS = (
    ["Region", "Constituency", "Area Code"]
    + [f"Number {y}" for y in YEARS]
    + [f"Percentage {y}" for y in YEARS]
)

LA_COLS = (
    ["Region", "Local Authority", "Area Code"]
    + [f"Number {y}" for y in YEARS]
    + [f"Percentage {y}" for y in YEARS]
)

_DATASET_DEFAULTS = {
    "label": "Estimated child poverty",
    "description": "Percentage of children living in households with a net income (after housing costs) below 60% of the national median.",
    "release_date": "June 2025",
    "data_type": "percent",
    "category": "place",
    "source_label": "Data from End Child Poverty, based on data from DWP/HMRC.",
    "source": SOURCE_URL,
    "source_type": "xlsx",
    "data_url": SOURCE_URL,
    "table": "areadata",
    "fill_blanks": False,
    "comparators": DataSet.numerical_comparators(),
    "default_value": 10,
    "unit_type": "percentage",
    "unit_distribution": "people_in_area",
}

CONSTITUENCY_DATA_SETS = {
    "constituency_child_poverty": {
        "defaults": _DATASET_DEFAULTS,
        "col": "Percentage 2023/24",
    }
}

LOCAL_AUTHORITY_DATA_SETS = {
    "local_authority_child_poverty": {
        "defaults": _DATASET_DEFAULTS,
        "col": "Percentage 2023/24",
    }
}


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    help = "Import data about child poverty"

    source_url = SOURCE_URL
    cast_field = FloatField
    uses_gss = True
    do_not_convert = True
    cons_row = "Area Code"
    message = "Importing child poverty data"
    area_types = ["WMC23", "STC", "DIS"]

    @property
    def data_sets(self):
        if self.area_type == "WMC23":
            return CONSTITUENCY_DATA_SETS
        return LOCAL_AUTHORITY_DATA_SETS

    def get_dataframe(self):
        if self.area_type == "WMC23":
            df = pd.read_excel(DATA_FILE, sheet_name="Constituency ", skiprows=1)
            df.columns = CONSTITUENCY_COLS
        else:
            df = pd.read_excel(DATA_FILE, sheet_name="Local Authority", skiprows=1)
            df.columns = LA_COLS
            df = filter_authority_type(df, self.area_type, "Area Code")

        percentage_cols = [col for col in df.columns if col.startswith("Percentage")]
        for col in percentage_cols:
            df[col] = df[col] * 100

        return df.dropna(subset=["Percentage 2023/24"])
