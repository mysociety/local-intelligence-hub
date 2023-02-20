import pandas as pd
from mysoc_dataset import get_dataset_url

from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import RUC data"

    cons_row = "gss-code"
    message = "Importing constituency rural urban classification data"
    data_sets = {
        "constituency_ruc": {
            "defaults": {
                "label": "Urban Rural Classification",
                "description": "Urban Rural Classification",
                "data_type": "text",
                "category": "place",
                "source_label": "mySociety",
                "source": "https://mysociety.github.io/uk_ruc/",
                "source_type": "csv",
                "table": "areadata",
                "is_filterable": True,
                "options": [
                    dict(title="Sparse and rural", shader="lightgreen"),
                    dict(title="Urban with rural areas", shader="lightgrey"),
                    dict(title="Rural", shader="green"),
                    dict(title="Urban", shader="grey"),
                ],
                "comparators": DataSet.in_comparators(),
            },
            "col": "ruc-cluster-label",
        }
    }
    package = {
        "repo_name": "uk_ruc",
        "package_name": "uk_ruc",
        "version_name": "2.0.0",
        "file_name": "pcon_ruc.csv",
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

        self.data_sets["constituency_ruc"]["defaults"]["data_url"] = url

    def get_dataframe(self):
        return pd.read_csv(self.data_sets["constituency_ruc"]["defaults"]["data_url"])

    def update_averages(self):
        pass

    def update_max_min(self):
        pass
