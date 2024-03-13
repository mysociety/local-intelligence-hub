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
    message = "Importing council climate emergency declarations"
    uses_gss = True
    do_not_convert = True

    area_types = ["STC", "DIS"]

    defaults = {
        "label": "Council has declared a climate emergency",
        "data_type": "text",
        "category": "place",
        "source_label": "Data from mySociety.",
        "source": "https://pages.mysociety.org/la-plans-promises/",
        "source_type": "csv",
        "table": "areadata",
        "data_url": "https://pages.mysociety.org/la-plans-promises/downloads/local-authority-climate-emergency-declarations-declarations-csv/latest",
        "comparators": DataSet.in_comparators(),
        "is_filterable": True,
        "is_shadable": True,
        "is_public": True,
        "unit_type": "raw",
        "unit_distribution": "physical_area",
        "options": [
            {"title": "Yes", "shader": "#068670"},
            {"title": "No", "shader": "#DEE2E6"},
        ],
    }

    data_sets = {
        "council_emergency_declaration": {
            "defaults": defaults,
            "col": "declared",
        },
    }

    def get_dataframe(self):
        url = get_dataset_url(
            repo_name="la-plans-promises",
            package_name="local_authority_climate_emergency_declarations",
            version_name="latest",
            file_name="declarations.csv",
            done_survey=True,
        )
        df = pd.read_csv(url)

        councils = []
        for index, row in df.iterrows():
            councils.append(
                {
                    "gss_code": row["gss_code"],
                    "declared": declare_map.get(row["made_declaration"], "No"),
                }
            )

        df = pd.DataFrame(councils)

        return df
