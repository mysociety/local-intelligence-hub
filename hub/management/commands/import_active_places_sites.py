import re
from datetime import date

from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .active_lives_helpers import GSS_CODE_REMAP
from .base_importers import (
    BaseConstituencyGroupListImportCommand,
    MultipleAreaTypesMixin,
)

SOURCE_URL = "https://www.activeplacespower.com/pages/downloads"


def to_title_case(name):
    """Convert an ALL CAPS site name to Title Case, without mangling
    possessives, e.g. "WOMEN'S INSTITUTE HALL" -> "Women's Institute Hall"
    rather than str.title()'s "Women'S Institute Hall"."""
    return re.sub(r"'S\b", "'s", name.title())


class Command(MultipleAreaTypesMixin, BaseConstituencyGroupListImportCommand):
    help = "Import data about sports and leisure facilities from the Active Places database"
    message = "Importing Active Places sports facilities data"

    data_file = settings.BASE_DIR / "data" / "active-places-sites.csv"

    uses_gss = True
    area_types = ["STC", "DIS", "WMC23"]
    cons_col_map = {
        "STC": "gss_la",
        "DIS": "gss_la",
        "WMC23": "Parliamentary Constituency Code",
    }

    defaults = {
        "label": "Sports and leisure facilities",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "release_date": str(date.today()),
        "source_label": "Data from Sport England’s Active Places database.",
        "source": SOURCE_URL,
        "source_type": "csv",
        "table": "areadata",
        "default_value": {},
        "is_filterable": True,
        "is_shadable": False,
        "is_public": True,
        "comparators": DataSet.string_comparators(),
        "unit_type": "point",
        "unit_distribution": "point",
        "exclude_countries": ["Scotland", "Wales", "Northern Ireland"],
    }

    count_defaults = {
        "label": "Number of sports and leisure facilities",
        "data_type": "integer",
        "category": "movement",
        "release_date": str(date.today()),
        "source_label": "Data from Sport England’s Active Places database.",
        "source": SOURCE_URL,
        "source_type": "csv",
        "table": "areadata",
        "default_value": 0,
        "is_filterable": True,
        "is_shadable": True,
        "is_public": True,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "raw",
        "unit_distribution": "physical_area",
        "exclude_countries": ["Scotland", "Wales", "Northern Ireland"],
    }

    data_sets = {
        "active_places_sites": {
            "defaults": defaults,
        },
        "active_places_sites_count": {
            "defaults": count_defaults,
        },
    }

    group_data_type = "active_places_sites"
    count_data_type = "active_places_sites_count"

    def get_df(self):
        if not self.data_file.exists():
            return None

        df = pd.read_csv(
            self.data_file,
            encoding="utf-8-sig",
            usecols=[
                "Site Name",
                "Local Authority Code",
                "Parliamentary Constituency Code",
                "Closed Date",
                "Website",
            ],
        )
        df = df.rename(columns={"Website": "url"})

        # Drop sites that have since closed - their name is also suffixed
        # "(CLOSED)", which "Closed Date" being set lines up with exactly.
        df = df[df["Closed Date"].isna()]

        df["group_name"] = df["Site Name"].apply(to_title_case)

        # A couple of local authority codes in this data are boundary changes
        # the mysoc name/code lookup dataset hasn't caught up with yet - same
        # fix as active_lives_helpers.py.
        df["gss_la"] = df["Local Authority Code"].replace(GSS_CODE_REMAP)

        return df

    def get_group_json(self, row):
        return row[["group_name", "url"]].dropna().to_dict()
