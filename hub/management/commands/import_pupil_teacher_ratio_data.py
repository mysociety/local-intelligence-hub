from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin

LA_DATA_FILE = settings.BASE_DIR / "data" / "workforce_ptrs_2010_2025_nat_reg_la.csv"
PCON_DATA_FILE = settings.BASE_DIR / "data" / "workforce_ptrs_2010_2025_pcon.csv"
SOURCE_URL = "https://explore-education-statistics.service.gov.uk/find-statistics/school-workforce-in-england/2025/explore"

_DEFAULTS = {
    "release_date": "June 2026",
    "data_type": "integer",
    "category": "place",
    "source_label": "Data from the Department for Education.",
    "source": SOURCE_URL,
    "source_type": "csv",
    "data_url": SOURCE_URL,
    "table": "areadata",
    "comparators": DataSet.numerical_comparators(),
    "default_value": 17,
    "unit_type": "raw",
    "unit_distribution": "people_in_area",
    "is_public": True,
    "fill_blanks": False,
    "exclude_countries": ["Scotland", "Wales", "Northern Ireland"],
}

data_sets = {
    "primary_pupil_teacher": {
        "defaults": {
            **_DEFAULTS,
            "label": "Primary school pupils per teacher",
            "description": "Average number of pupils per qualified teacher in state-funded primary schools and nurseries, in the most recent academic year. This is often called the pupil-teacher ratio.",
        },
        "col": "primary_pupil_teacher",
    },
    "secondary_pupil_teacher": {
        "defaults": {
            **_DEFAULTS,
            "label": "Secondary school pupils per teacher",
            "description": "Average number of pupils per qualified teacher in state-funded secondary schools, in the most recent academic year. This is often called the pupil-teacher ratio.",
        },
        "col": "secondary_pupil_teacher",
    },
}


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    help = "Import school pupil-teacher ratio data"

    cons_row = "gss_code"
    uses_gss = True
    do_not_convert = True
    area_types = ["STC", "WMC23"]
    message = "Importing pupil-teacher ratio data"
    data_sets = data_sets

    def get_dataframe(self):
        if self.area_type == "WMC23":
            return self._get_pcon_dataframe()
        return self._get_la_dataframe()

    def _get_la_dataframe(self):
        df = pd.read_csv(
            LA_DATA_FILE,
            encoding="utf-8-sig",
            dtype={"new_la_code": str},
            usecols=[
                "new_la_code",
                "time_period",
                "establishment_type_group",
                "pupil_to_qual_teacher_ratio",
            ],
        )
        df = df[df["new_la_code"].notna() & (df["new_la_code"].str.strip() != "")]
        df = df[df["time_period"].astype(str) == "202526"]
        df["pupil_to_qual_teacher_ratio"] = pd.to_numeric(
            df["pupil_to_qual_teacher_ratio"], errors="coerce"
        )

        primary = df[
            df["establishment_type_group"] == "State-funded nursery and primary"
        ][["new_la_code", "pupil_to_qual_teacher_ratio"]].rename(
            columns={
                "new_la_code": "gss_code",
                "pupil_to_qual_teacher_ratio": "primary_pupil_teacher",
            }
        )

        secondary = df[df["establishment_type_group"] == "State-funded secondary"][
            ["new_la_code", "pupil_to_qual_teacher_ratio"]
        ].rename(
            columns={
                "new_la_code": "gss_code",
                "pupil_to_qual_teacher_ratio": "secondary_pupil_teacher",
            }
        )

        merged = primary.merge(secondary, on="gss_code")
        merged["primary_pupil_teacher"] = (
            merged["primary_pupil_teacher"].round().astype("Int64")
        )
        merged["secondary_pupil_teacher"] = (
            merged["secondary_pupil_teacher"].round().astype("Int64")
        )
        return merged

    def _get_pcon_dataframe(self):
        df = pd.read_csv(
            PCON_DATA_FILE,
            encoding="utf-8-sig",
            dtype={"pcon_code": str},
            usecols=[
                "pcon_code",
                "time_period",
                "school_type",
                "pupil_to_qual_teacher_ratio",
            ],
        )
        df = df[df["pcon_code"].notna() & (df["pcon_code"].str.strip() != "")]
        df = df[df["time_period"].astype(str) == "202526"]

        # Remap new 2023 boundary codes to the codes stored in the database.
        df = df.replace("E14001038", "E14001581")  # Weston-super-Mare
        df["pupil_to_qual_teacher_ratio"] = pd.to_numeric(
            df["pupil_to_qual_teacher_ratio"], errors="coerce"
        )

        primary = df[df["school_type"] == "State-funded nursery and primary"][
            ["pcon_code", "pupil_to_qual_teacher_ratio"]
        ].rename(
            columns={
                "pcon_code": "gss_code",
                "pupil_to_qual_teacher_ratio": "primary_pupil_teacher",
            }
        )

        secondary = df[df["school_type"] == "State-funded secondary"][
            ["pcon_code", "pupil_to_qual_teacher_ratio"]
        ].rename(
            columns={
                "pcon_code": "gss_code",
                "pupil_to_qual_teacher_ratio": "secondary_pupil_teacher",
            }
        )

        merged = primary.merge(secondary, on="gss_code")
        merged["primary_pupil_teacher"] = (
            merged["primary_pupil_teacher"].round().astype("Int64")
        )
        merged["secondary_pupil_teacher"] = (
            merged["secondary_pupil_teacher"].round().astype("Int64")
        )
        return merged
