import pandas as pd
import requests

from hub.import_utils import filter_authority_type
from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    cons_row = "gss_code"
    message = "Importing council climate emergency declarations"
    uses_gss = True
    do_not_convert = True

    area_types = ["STC", "DIS"]

    defaults = {
        "label": "Council has a Climate Action Plan",
        "data_type": "text",
        "category": "place",
        "source_label": "Data from mySociety and Climate Emergency UK.",
        "source": "http://cape.mysociety.org/",
        "source_type": "csv",
        "table": "areadata",
        "data_url": "https://cape.mysociety.org/api/councils/",
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
        "council_has_plan": {
            "defaults": defaults,
            "col": "has_plan",
        },
    }

    def get_dataframe(self):
        results = requests.get("https://cape.mysociety.org/api/councils/")
        data = results.json()

        councils = []
        for row in data:
            has_plan = "No"
            if row["plan_count"] > 0:
                has_plan = "Yes"
            councils.append(
                {
                    "gss_code": row["gss_code"],
                    "has_plan": has_plan,
                }
            )

        df = pd.DataFrame(councils)
        df = filter_authority_type(df, self.area_type, self.cons_row)

        return df
