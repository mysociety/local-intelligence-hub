from django.conf import settings

import pandas as pd
import requests

from hub.models import DataSet

from .base_importers import BaseConstituencyGroupListImportCommand

TWFY_CONSTITUENCIES_DATA_URL = "https://raw.githubusercontent.com/mysociety/parlparse/master/members/constituencies.json"
HARD_CODED_CONSTITUENCY_LOOKUP = {}


class Command(BaseConstituencyGroupListImportCommand):
    help = "Import data about Christian Aid groups per constituency"
    message = "Importing Christian Aid group data"

    data_file = settings.BASE_DIR / "data" / "christian_aid_groups.csv"
    defaults = {
        "label": "Christian Aid groups",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "release_date": "April 2023",
        "source_label": "Data from Christian Aid.",
        "source": "",
        "source_type": "api",
        "data_url": "",
        "table": "areadata",
        "default_value": {},
        "is_filterable": False,
        "comparators": DataSet.comparators_default(),
    }

    count_defaults = {
        "label": "Number of Christian Aid groups",
        "data_type": "integer",
        "release_date": "April 2023",
        "category": "movement",
        "source_label": "Data from Christian Aid.",
        "source": "",
        "source_type": "api",
        "data_url": "",
        "table": "areadata",
        "default_value": 0,
        "is_filterable": True,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "point",
        "unit_distribution": "point",
    }

    data_sets = {
        "constituency_christian_aid_groups": {
            "defaults": defaults,
        },
        "constituency_christian_aid_group_count": {
            "defaults": count_defaults,
        },
    }

    group_data_type = "constituency_christian_aid_groups"
    count_data_type = "constituency_christian_aid_group_count"

    def add_to_dict(self, df):
        names = df.names.tolist()
        # Add a version of the main name, without any commas
        names.append(names[0].replace(",", ""))
        # The first name listed is the ideal form
        name = names.pop(0)
        return {alt_name.replace(",", ""): name for alt_name in names}

    def build_constituency_name_lookup(self):
        # Grab the TWFY data, and ignore any constituencies that no longer exist
        # We're only interested in the names, so keep them, and explode the column.
        # Then group by (arbitrary) index, and build the dictionary from these groups

        response = requests.get(TWFY_CONSTITUENCIES_DATA_URL)
        df = pd.DataFrame.from_records(response.json())
        df = df.query("end_date.isna()")["names"].reset_index()
        df = df.explode("names", ignore_index=True)

        # Start with hard-coded lookup
        names_lookup_dict = HARD_CODED_CONSTITUENCY_LOOKUP.copy()
        for i, names_df in df.groupby("index"):
            new_dict = self.add_to_dict(names_df)
            if new_dict:
                names_lookup_dict.update(new_dict)

        return names_lookup_dict

    def get_df(self):
        df = pd.read_csv(
            self.data_file,
            usecols=[
                "Account Name",
                "Westminster Parliamentary Constituency (Postcode District) (Postcode District)",
            ],
        )

        df.columns = [
            "group_name",
            "constituency",
        ]

        # Build a constituency lookup from TWFY data, and apply it to the constituency column, so that the names are all in a form that LIH recognises
        constituency_lookup = self.build_constituency_name_lookup()
        df.constituency = df.constituency.apply(
            lambda x: constituency_lookup.get(x.replace(",", ""), x)
            if not pd.isna(x)
            else ""
        )
        return df

    def get_group_json(self, row):
        return row[["group_name"]].dropna().to_dict()
