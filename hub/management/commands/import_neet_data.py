from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin

DATA_FILE = settings.BASE_DIR / "data" / "ud_neet_characteristics.csv"
SOURCE_URL = "https://explore-education-statistics.service.gov.uk/find-statistics/participation-in-education-training-and-neet-age-16-to-17-by-local-authority/2024-25/explore"

_DEFAULTS = {
    "release_date": "July 2025",
    "category": "place",
    "source_label": "Data from the Department for Education.",
    "source": SOURCE_URL,
    "source_type": "csv",
    "data_url": SOURCE_URL,
    "table": "areadata",
    "comparators": DataSet.numerical_comparators(),
    "is_public": True,
    "fill_blanks": False,
    "exclude_countries": ["Scotland", "Wales", "Northern Ireland"],
}


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    help = "Import NEET data for 16–17 year olds"

    cons_row = "new_la_code"
    uses_gss = True
    do_not_convert = True
    area_types = ["STC"]
    message = "Importing NEET data"

    data_sets = {
        "neet_absolute": {
            "defaults": {
                **_DEFAULTS,
                "label": "Number of 16–17 year olds not in education, employment or training",
                "data_type": "float",
                "default_value": 500,
                "unit_type": "raw",
                "unit_distribution": "people_in_area",
            },
            "col": "avgNEET",
        },
        "neet_percent": {
            "defaults": {
                **_DEFAULTS,
                "label": "Proportion of 16–17 year olds not in education, employment or training",
                "data_type": "percent",
                "default_value": 5,
                "unit_type": "percentage",
                "unit_distribution": "people_in_area",
            },
            "col": "NEETprop",
        },
    }

    def get_dataframe(self):
        df = pd.read_csv(
            DATA_FILE,
            dtype={"new_la_code": str},
            usecols=[
                "new_la_code",
                "time_period",
                "Age",
                "Characteristic_grouping",
                "avgNEET",
                "NEETprop",
            ],
        )
        df = df[df["new_la_code"].notna() & (df["new_la_code"].str.strip() != "")]
        df = df[
            (df["time_period"].astype(str) == "2025")
            & (df["Age"] == "16-17")
            & (df["Characteristic_grouping"] == "Total")
        ]

        # Update GSS codes for post-2023 boundary changes.
        df = df.replace("E08000019", "E08000039")  # Sheffield
        df = df.replace("E08000016", "E08000038")  # Barnsley

        df["avgNEET"] = pd.to_numeric(df["avgNEET"], errors="coerce")
        df["NEETprop"] = pd.to_numeric(df["NEETprop"], errors="coerce")

        return df
