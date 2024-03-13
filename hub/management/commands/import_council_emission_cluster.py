import pandas as pd
from mysoc_dataset import get_dataset_url

from hub.import_utils import add_gss_codes
from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin

shaders = [
    {"title": "Agriculture", "shader": "green"},
    {"title": "City of London", "shader": "lightgrey"},
    {"title": "Industry/Commerical/Domestic", "shader": "darkblue"},
    {"title": "Public sector", "shader": "lightblue"},
    {"title": "Transport/Domestic", "shader": "lightpurple"},
    {"title": "Urban Mainstream", "shader": "darkgrey"},
]


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    cons_row = "gss_code"
    message = "Importing council emissions data"
    uses_gss = True
    do_not_convert = True

    area_types = ["STC", "DIS"]

    defaults = {
        "label": "Emissions profile",
        "data_type": "text",
        "category": "place",
        "description": "Labels local authorities based on the profile of their 2020 emissions to enable authorities with similar patterns of emissions to be compared.",
        "release_date": "January 2022",
        "source_label": "Data from the Department of Business, Energy & Industrial Strategy collated and analysed by mySociety.",
        "source": "https://pages.mysociety.org/la-emissions-data/",
        "source_type": "csv",
        "table": "areadata",
        "data_url": "https://pages.mysociety.org/la-emissions-data/datasets/uk_local_authority_emissions_data/latest",
        "comparators": DataSet.in_comparators(),
        "options": shaders,
        "is_filterable": True,
        "is_shadable": True,
        "is_public": True,
        "unit_type": "raw",
        "unit_distribution": "physical_area",
    }

    data_sets = {
        "council_emissions_label": {
            "defaults": defaults,
            "col": "label",
        },
    }

    def get_dataframe(self):
        url = get_dataset_url(
            repo_name="la-emissions-data",
            package_name="uk_local_authority_emissions_data",
            version_name="latest",
            file_name="la_labels.csv",
            done_survey=True,
        )
        df = pd.read_csv(url)

        df = add_gss_codes(df, "local-authority-code")

        councils = []
        for index, row in df.iterrows():
            councils.append(
                {
                    "gss_code": row["gss_code"],
                    "label": row["label"],
                }
            )

        df = pd.DataFrame(councils)

        return df
