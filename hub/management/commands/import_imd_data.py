import pandas as pd
from mysoc_dataset import get_dataset_url

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import IMD data"

    cons_row = "gss-code"
    message = "Importing constituency IMD data"
    data_sets = {
        "constituency_imd": {
            "defaults": {
                "source": "https://mysociety.github.io/composite_uk_imd/",
                "source_label": "mySociety",
                "name": "constituency_imd",
                "description": "Index of Multiple Deprivation",
                "label": "Index of Multiple Deprivation",
                "data_type": "integer",
                "category": "place",
                "source_type": "csv",
            },
            "col": "pcon-imd-pop-quintile",
        }
    }
    package = {
        "repo_name": "composite_uk_imd",
        "package_name": "uk_index",
        "version_name": "3.0.0",
        "file_name": "constituency_imd.csv",
    }

    def __init__(self):
        super().__init__()

        url = get_dataset_url(
            repo_name=self.package["repo_name"],
            package_name=self.package["package_name"],
            version_name=self.package["version_name"],
            file_name=self.package["file_name"],
            done_survey=True,
        )

        self.data_sets["constituency_imd"]["defaults"]["data_url"] = url

    def get_dataframe(self):
        return pd.read_csv(self.data_sets["constituency_imd"]["defaults"]["data_url"])

    def update_averages(self):
        pass
