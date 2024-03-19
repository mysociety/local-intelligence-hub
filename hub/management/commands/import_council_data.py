import pandas as pd
from mysoc_dataset import get_dataset_url

from hub.import_utils import filter_authority_type
from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    cons_row = "gss-code"
    message = "Importing council population data"
    uses_gss = True
    do_not_convert = True

    area_types = ["STC", "DIS"]

    defaults = {
        "data_type": "integer",
        "category": "place",
        "subcategory": "",
        "release_date": "2020",
        "label": "Council population",
        "source_label": "Data from mySociety.",
        "source": "https://pages.mysociety.org/uk_local_authority_names_and_codes/datasets/uk_la_future/latest",
        "source_type": "csv",
        "table": "areadata",
        "default_value": 1000,
        "data_url": "https://pages.mysociety.org/uk_local_authority_names_and_codes/downloads/uk-la-future-uk-local-authorities-future-csv/latest",
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
        "is_public": True,
    }

    data_sets = {
        "council_population_count": {
            "defaults": defaults,
            "col": "pop-2020",
        },
    }

    def get_dataframe(self):
        url = get_dataset_url(
            repo_name="uk_local_authority_names_and_codes",
            package_name="uk_la_future",
            version_name="1",
            file_name="uk_local_authorities_future.csv",
            done_survey=True,
        )
        df = pd.read_csv(url)
        df = filter_authority_type(df, self.area_type, self.cons_row)

        return df
