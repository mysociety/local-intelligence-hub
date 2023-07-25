from django.conf import settings

import pandas as pd
from mysoc_dataset import get_dataset_df

from hub.models import AreaData, DataSet
from utils.constituency_mapping import convert_data_geographies

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import data about number of national trust members per constituency"

    data_file = settings.BASE_DIR / "data" / "nt_members.csv"
    cons_row = "con"
    message = "Importing NT members data"
    uses_gss = True

    defaults = {
        "data_type": "integer",
        "category": "movement",
        "subcategory": "supporters_and_activists",
        "source_label": "National Trust",
        "source": "https://www.nationaltrust.org.uk/",
        "source_type": "google sheet",
        "table": "areadata",
        "default_value": 10,
        "data_url": "",
        "exclude_countries": ["Scotland"],
        "comparators": DataSet.numerical_comparators(),
    }

    data_sets = {
        "nt_members_count": {
            "defaults": defaults,
            "col": "members",
        },
    }

    def get_dataframe(self):
        df = pd.read_csv(self.data_file, usecols=["Constituency Name", "Total Members"])
        df = df.rename(
            columns={"Constituency Name": "PARL25", "Total Members": "members"}
        )
        constituencies_df = get_dataset_df(
            repo_name="2025-constituencies",
            package_name="parliament_con_2025",
            version_name="latest",
            file_name="parl_constituencies_2025.csv",
        )
        constituencies_lookup = constituencies_df.set_index("name").short_code.to_dict()
        df["PARL25"] = df["PARL25"].apply(
            lambda name: constituencies_lookup.get(name, None)
        )
        df = convert_data_geographies(
            df=df,
            input_geography="PARL25",
            output_geography="PARL10",
            input_values_type="absolute",
        )
        df = df.rename(columns={"PARL10": "con"})
        return df

    def get_label(self, defaults):
        return "Number of National Trust Members"

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types.values()).delete()
