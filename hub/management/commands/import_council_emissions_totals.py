import pandas as pd
from mysoc_dataset import get_dataset_url

from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin

declare_map = {
    "Y": "Yes",
    "N": "No",
}


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    cons_row = "gss_code"
    message = "Importing council emissions data"
    uses_gss = True
    do_not_convert = True

    area_types = ["STC", "DIS"]

    defaults = {
        "label": "Total emissions (ktCO2)",
        "description": "Estimated 2020 carbon dioxide emissions within the scope of influence of local authorities.",
        "data_type": "integer",
        "category": "place",
        "release_date": "2020",
        "source_label": "Data from the Department of Business, Energy & Industrial Strategy collated by mySociety.",
        "source": "https://pages.mysociety.org/la-emissions-data/",
        "source_type": "csv",
        "table": "areadata",
        "data_url": "https://pages.mysociety.org/la-emissions-data/datasets/uk_local_authority_emissions_data/latest",
        "comparators": DataSet.numerical_comparators(),
        "is_filterable": True,
        "is_shadable": True,
        "is_public": True,
        "unit_type": "raw",
        "unit_distribution": "physical_area",
    }

    data_sets = {
        "council_total_emissions": {
            "defaults": defaults,
            "col": "emissions",
        },
    }

    def get_dataframe(self):
        url = get_dataset_url(
            repo_name="la-emissions-data",
            package_name="uk_local_authority_emissions_data",
            version_name="latest",
            file_name="local_authority_emissions.csv",
            done_survey=True,
        )
        df = pd.read_csv(url)
        df = df.loc[df["Year"] == 2020]

        councils = []
        for index, row in df.iterrows():
            councils.append(
                {
                    "gss_code": row["gss_code"],
                    "emissions": row["Total Emissions:kt CO2"],
                }
            )

        df = pd.DataFrame(councils)

        return df
