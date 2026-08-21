from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin

DATA_FILE = settings.BASE_DIR / "data" / "1_Absence_3term_nat_reg_la.csv"
SOURCE_URL = "https://explore-education-statistics.service.gov.uk/data-catalogue/data-set/d37f27c4-cca2-4274-97e9-1cdcb4ecad18"

_DEFAULTS = {
    "release_date": "March 2026",
    "data_type": "percent",
    "category": "place",
    "source_label": "Data from the Department for Education.",
    "source": SOURCE_URL,
    "source_type": "csv",
    "data_url": SOURCE_URL,
    "table": "areadata",
    "comparators": DataSet.numerical_comparators(),
    "default_value": 10,
    "unit_type": "percentage",
    "unit_distribution": "people_in_area",
    "is_public": True,
    "fill_blanks": False,
    "exclude_countries": ["Scotland", "Wales", "Northern Ireland"],
}


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    help = "Import school absence and exclusion rate data"

    cons_row = "new_la_code"
    uses_gss = True
    do_not_convert = True
    area_types = ["STC"]
    message = "Importing school absence and exclusion data"

    data_sets = {
        "primary_absence_rate": {
            "defaults": {
                **_DEFAULTS,
                "label": "Primary school absence rate",
                "description": "Proportion of primary school pupils who were absent for more than 10% of the most recent academic year.",
            },
            "col": "primary_absence_rate",
        },
        "primary_exclusion_rate": {
            "defaults": {
                **_DEFAULTS,
                "label": "Primary school exclusion rate",
                "description": "Proportion of primary school pupils who were excluded in the most recent academic year.",
            },
            "col": "primary_exclusion_rate",
        },
        "secondary_absence_rate": {
            "defaults": {
                **_DEFAULTS,
                "label": "Secondary school absence rate",
                "description": "Proportion of secondary school pupils who were absent for more than 10% of the most recent academic year.",
            },
            "col": "secondary_absence_rate",
        },
        "secondary_exclusion_rate": {
            "defaults": {
                **_DEFAULTS,
                "label": "Secondary school exclusion rate",
                "description": "Proportion of secondary school pupils who were excluded in the most recent academic year.",
            },
            "col": "secondary_exclusion_rate",
        },
    }

    def get_dataframe(self):
        df = pd.read_csv(
            DATA_FILE,
            encoding="utf-8-sig",
            dtype={"new_la_code": str},
            usecols=[
                "new_la_code",
                "time_period",
                "education_phase",
                "enrolments_pa_10_exact_percent",
                "sess_auth_excluded_rate",
            ],
        )
        df = df[df["new_la_code"].notna() & (df["new_la_code"].str.strip() != "")]
        df = df[df["time_period"].astype(str) == "202425"]

        # Update GSS codes for post-2023 boundary changes.
        df = df.replace("E08000019", "E08000039")  # Sheffield
        df = df.replace("E08000016", "E08000038")  # Barnsley

        value_cols = [
            "new_la_code",
            "enrolments_pa_10_exact_percent",
            "sess_auth_excluded_rate",
        ]

        primary = df[df["education_phase"] == "State-funded primary"][value_cols].copy()
        for col in ["enrolments_pa_10_exact_percent", "sess_auth_excluded_rate"]:
            primary[col] = pd.to_numeric(primary[col], errors="coerce")
        primary = primary.rename(
            columns={
                "enrolments_pa_10_exact_percent": "primary_absence_rate",
                "sess_auth_excluded_rate": "primary_exclusion_rate",
            }
        )

        secondary = df[df["education_phase"] == "State-funded secondary"][
            value_cols
        ].copy()
        for col in ["enrolments_pa_10_exact_percent", "sess_auth_excluded_rate"]:
            secondary[col] = pd.to_numeric(secondary[col], errors="coerce")
        secondary = secondary.rename(
            columns={
                "enrolments_pa_10_exact_percent": "secondary_absence_rate",
                "sess_auth_excluded_rate": "secondary_exclusion_rate",
            }
        )

        return primary.merge(secondary, on="new_la_code")
