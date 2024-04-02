import pandas as pd
from mysoc_dataset import get_dataset_url

from hub.import_utils import add_gss_codes, filter_authority_type
from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    help = "Import Council IMD data"

    message = "Importing council IMD data"
    cons_row = "gss_code"
    area_types = ["STC", "DIS"]
    uses_gss = True
    do_not_convert = True

    data_sets = {
        "constituency_imd": {
            "defaults": {
                "source": "https://mysociety.github.io/composite_uk_imd/",
                "source_label": "Data from ONS (England and Wales), NRS (Scotland), and NISRA (Northern Ireland), collated and standardised by mySociety.",
                "name": "constituency_imd",
                "description": "Deciles of deprivation, from 1 (most deprived) to 10 (least deprived). This uses a composite measure of deprivation (including income, employment, education, skills, health, crime, and housing) standardised across the countries of the UK.",
                "label": "Index of Multiple Deprivation (IMD)",
                "data_type": "integer",
                "category": "place",
                "source_type": "csv",
                "table": "areadata",
                "comparators": DataSet.numerical_comparators()[::-1],
                "default_value": 5,
                "unit_type": "percentage",
                "unit_distribution": "people_in_area",
                "is_public": True,
            },
            "col": "la-imd-pop-quintile",
        }
    }
    package = {
        "repo_name": "composite_uk_imd",
        "package_name": "uk_index",
        "version_name": "3.3.0",
        "file_name": "la_imd.csv",
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
        df = pd.read_csv(self.data_sets["constituency_imd"]["defaults"]["data_url"])

        df = add_gss_codes(df, "local-authority-code")
        df = filter_authority_type(df, self.area_type, self.cons_row)
        return df

    def update_averages(self):
        pass
