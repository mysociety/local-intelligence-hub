from django.conf import settings

import pandas as pd
import requests

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand

TWFY_CONSTITUENCIES_DATA_URL = "https://raw.githubusercontent.com/mysociety/parlparse/master/members/constituencies.json"
HARD_CODED_CONSTITUENCY_LOOKUP = {
    "Cotswolds The": "The Cotswolds",
    "Basildon South and East Thurrock": "South Basildon and East Thurrock",
    "Na h-Eileanan An Iar (Western Isles)": "Na h-Eileanan an Iar",
}


class Command(BaseImportFromDataFrameCommand):
    help = "Import Onward polling data on attitudes to net zero and climate change"

    data_file = settings.BASE_DIR / "data" / "onward_mrp_polling_data.csv"
    cons_row = "constituency"
    message = "Importing Onward polling data"
    uses_gss = False

    defaults = {
        "data_type": "integer",
        "category": "opinion",
        "source_label": "Public First MRP Polling, commissioned by Onward UK.",
        "release_date": "July 2022",
        "source": "https://www.publicfirst.co.uk/new-public-first-polling-for-onward.html",
        "source_type": "google sheet",
        "subcategory": "net_zero_support",
        "table": "areadata",
        "default_value": 10,
        "data_url": "",
        "exclude_countries": ["Northern Ireland"],
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    }

    data_sets = {
        "constituency_nz_support": {
            "defaults": {
                **defaults,
                "description": "Estimated percentage of constituents who support net zero.",
            },
            "col": "support net zero",
        },
        "constituency_nz_neutral": {
            "defaults": {
                **defaults,
                "description": "Estimated percentage of constituents who neither support nor oppose net zero.",
            },
            "col": "neither support nor oppose net zero",
        },
        "constituency_nz_oppose": {
            "defaults": {
                **defaults,
                "description": "Estimated percentage of constituents who oppose net zero.",
            },
            "col": "oppose net zero",
        },
        "constituency_cc_high": {
            "defaults": {
                **defaults,
                "description": "Estimated percentage of constituents who consider climate change a high priority.",
            },
            "col": "consider climate change a high priority",
        },
    }
    del data_sets["constituency_cc_high"]["defaults"]["subcategory"]

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

    def get_dataframe(self):
        converters_dict = {
            col: lambda x: int(x[:-1])
            for col in ["Q02_Support", "Q02_Neutral", "Q02_Oppose", "Q07_High"]
        }
        df = pd.read_csv(
            self.data_file,
            usecols=["Seat", "Q02_Support", "Q02_Neutral", "Q02_Oppose", "Q07_High"],
            converters=converters_dict,
        )
        df.columns = [
            "constituency",
            "support net zero",
            "neither support nor oppose net zero",
            "oppose net zero",
            "consider climate change a high priority",
        ]

        # Build a constituency lookup from TWFY data, and apply it to the constituency column, so that the names are all in a form that LIH recognises
        constituency_lookup = self.build_constituency_name_lookup()
        df.constituency = df.constituency.apply(
            lambda x: constituency_lookup.get(x.replace(",", ""), x)
        )
        return df

    def get_label(self, defaults):
        return defaults["col"].capitalize()

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types.values()).delete()
