from datetime import date

from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .base_importers import (
    BaseConstituencyGroupListImportCommand,
    MultipleAreaTypesMixin,
)


class Command(MultipleAreaTypesMixin, BaseConstituencyGroupListImportCommand):
    help = "Import Transition Network groups"
    message = "Importing Transition Network groups"

    data_file = settings.BASE_DIR / "data" / "transition_network_groups.csv"

    uses_gss = True
    area_types = ["WMC", "WMC23", "STC", "DIS"]
    cons_col_map = {
        "WMC": "WMC",
        "WMC23": "WMC23",
        "STC": "STC",
        "DIS": "DIS",
    }
    defaults = {
        "label": "Transition Network groups",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "release_date": str(date.today()),
        "source_label": "Data from Transition Network contributors under Open Database Licence.",
        "source": "https://maps.transitionnetwork.org/",
        "source_type": "api",
        "data_url": "https://maps.transitionnetwork.org/wp-json/cds/v1/initiatives/?country=GB&per_page=999",
        "table": "areadata",
        "default_value": {},
        "exclude_countries": [],
        "is_filterable": False,
        "is_shadable": False,
        "comparators": DataSet.comparators_default(),
        "unit_type": "point",
        "unit_distribution": "point",
    }

    count_defaults = {
        "label": "Number of Transition Network groups",
        "data_type": "integer",
        "category": "movement",
        "release_date": str(date.today()),
        "source_label": "Data from Transition Network contributors under Open Database Licence.",
        "source": "https://maps.transitionnetwork.org/",
        "source_type": "api",
        "data_url": "https://maps.transitionnetwork.org/wp-json/cds/v1/initiatives/?country=GB&per_page=999",
        "table": "areadata",
        "default_value": 0,
        "exclude_countries": [],
        "is_filterable": True,
        "is_shadable": True,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "point",
        "unit_distribution": "point",
    }

    data_sets = {
        "constituency_transition_groups": {
            "defaults": defaults,
        },
        "constituency_transition_group_count": {
            "defaults": count_defaults,
        },
    }

    group_data_type = "constituency_transition_groups"
    count_data_type = "constituency_transition_group_count"

    def get_df(self):
        if self.data_file.exists() is False:
            return None

        df = pd.read_csv(self.data_file)

        # Remove columns we don't need, and rename one we do.
        df = df.rename(
            columns={
                "transition_network_url": "url"  # for automatic chip linking in template
            }
        ).drop(
            columns=[
                "transition_network_id",
                "group_url",
                "group_facebook",
            ]
        )

        return df

    def get_group_json(self, row):
        return row[["group_name", "url"]].dropna().to_dict()
