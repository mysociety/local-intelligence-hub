import pandas as pd
from mysoc_dataset import get_dataset_url

from hub.import_utils import add_gss_codes, filter_authority_type
from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    help = "Import Council RUC data"

    cons_row = "gss_code"
    message = "Importing council rural/urban classification"
    uses_gss = True
    do_not_convert = True

    area_types = ["STC", "DIS"]

    defaults = {
        "label": "Rural Urban Classification",
        "description": "A composite measure of ‘ruralness’ (based on population density, settlement size, and drive times) standardised across the countries of the UK.",
        "data_type": "text",
        "category": "place",
        "source_label": "Data from ONS (England and Wales), NRS (Scotland), and NISRA (Northern Ireland), collated and standardised by mySociety.",
        "source": "https://data.mysociety.org/datasets/uk_ruc_uk_ruc/",
        "source_type": "csv",
        "table": "areadata",
        "data_url": "https://pages.mysociety.org/uk_ruc/downloads/uk-ruc-la-ruc-csv/latest",
        "comparators": DataSet.in_comparators(),
        "is_filterable": True,
        "is_shadable": True,
        "is_public": True,
        "options": [
            dict(title="Sparse and rural", shader="lightgreen"),
            dict(title="Urban with rural areas", shader="lightgrey"),
            dict(title="Rural", shader="green"),
            dict(title="Urban", shader="grey"),
        ],
        "unit_type": "raw",
        "unit_distribution": "physical_area",
    }

    data_sets = {
        "constituency_ruc": {
            "defaults": defaults,
            "col": "ruc-cluster-label",
        },
    }

    def get_dataframe(self):
        url = get_dataset_url(
            repo_name="uk_ruc",
            package_name="uk_ruc",
            version_name="latest",
            file_name="la_ruc.csv",
            done_survey=True,
        )
        df = pd.read_csv(url)
        df = add_gss_codes(df, "local-authority-code")
        df = filter_authority_type(df, self.area_type, "gss_code")

        return df
