import pandas as pd
from mysoc_dataset import get_dataset_url

from hub.import_utils import filter_authority_type
from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin

declare_map = {
    "Y": "Yes",
    "N": "No",
}


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    cons_row = "gss_code"
    message = "Importing council net zero target data"
    uses_gss = True
    do_not_convert = True

    area_types = ["STC", "DIS"]

    defaults = {
        "label": "Council Net Zero target date",
        "data_type": "integer",
        "category": "place",
        "subcategory": "date",
        "source_label": "Data from mySociety.",
        "source": "https://pages.mysociety.org/la-plans-promises/",
        "source_type": "csv",
        "table": "areadata",
        "data_url": "https://pages.mysociety.org/la-plans-promises/downloads/local-authority-climate-emergency-declarations-declarations-csv/latest",
        "comparators": DataSet.numerical_comparators(),
        "is_filterable": True,
        "is_shadable": True,
        "is_public": True,
        "unit_type": "raw",
        "unit_distribution": "physical_area",
        "fill_blanks": False,
    }

    data_sets = {
        "council_net_zero_date": {
            "defaults": defaults,
            "col": "year",
        },
        "council_net_zero_details": {
            "defaults": {
                **defaults,
                "data_type": "json",
                "label": "Net Zero target date details",
                "is_filterable": False,
                "is_shadable": False,
            },
            "col": "scope",
        },
    }

    def get_row_data(self, row, conf):
        if conf["col"] == "year":
            return row[conf["col"]]

        if pd.isna(row["url"]):
            return {"scope": row["scope"]}
        else:
            return {"scope": row["scope"], "url": row["url"]}

    def get_dataframe(self):
        url = get_dataset_url(
            repo_name="la-plans-promises",
            package_name="local_authority_net_zero_commitments",
            version_name="latest",
            file_name="promises.csv",
            done_survey=True,
        )
        df = pd.read_csv(url)
        df = filter_authority_type(df, self.area_type, self.cons_row)

        councils = []
        for index, row in df.iterrows():
            if pd.isna(row["target"]):
                continue
            councils.append(
                {
                    "gss_code": row["gss_code"],
                    "year": row["target"],
                    "scope": row["scope"],
                    "url": row["source_url"],
                }
            )

        df = pd.DataFrame(councils)

        return df
