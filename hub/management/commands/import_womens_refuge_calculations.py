import pandas as pd

from hub.models import AreaData, DataSet, DataType

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    help = "Calculate Council of Europe womens refuge recommendations from area populations"

    area_types = ["WMC23", "STC", "DIS"]

    message = "Importing womens refuge recommendations"
    do_not_convert = True
    cons_row = "gss_code"

    data_sets = {
        "recommended_womens_refuges": {
            "defaults": {
                "label": "Recommended number of women’s refuge spaces",
                "description": "The Council of Europe recommends one family place (in specialised women’s shelters) per 10,000 citizens.",
                "source": "https://www.coe.int/t/dc/files/ministerial_conferences/2009_justice/EG-TFV(2008)6_complete%20text.pdf",
                "source_label": "Calculated based on recommendations from The Council of Europe’s EG-TFV task force.",
                "data_type": "float",
                "category": "place",
                "source_type": "",
                "table": "areadata",
                "comparators": DataSet.numerical_comparators()[::-1],
                "is_shadable": True,
                "is_filterable": True,
                "default_value": 1,
                "unit_type": "raw",
                "unit_distribution": "people_in_area",
                "is_public": True,
            },
            "col": "recommended_womens_refuges",
        },
        "recommended_rape_crisis_centres": {
            "defaults": {
                "label": "Recommended number of rape crisis centres",
                "description": "The Council of Europe recommends one rape crisis centre per 200,000 women.",
                "source": "https://www.coe.int/t/dc/files/ministerial_conferences/2009_justice/EG-TFV(2008)6_complete%20text.pdf",
                "source_label": "Calculated based on recommendations from The Council of Europe’s EG-TFV task force.",
                "data_type": "float",
                "category": "place",
                "source_type": "",
                "table": "areadata",
                "comparators": DataSet.numerical_comparators()[::-1],
                "is_shadable": True,
                "is_filterable": True,
                "default_value": 1,
                "unit_type": "raw",
                "unit_distribution": "people_in_area",
                "is_public": True,
            },
            "col": "recommended_rape_crisis_centres",
        },
        "recommended_womens_counselling": {
            "defaults": {
                "label": "Recommended number of women’s counselling centres",
                "description": "The Council of Europe recommends one women’s counselling centre for every 50,000 women.",
                "source": "https://www.coe.int/t/dc/files/ministerial_conferences/2009_justice/EG-TFV(2008)6_complete%20text.pdf",
                "source_label": "Calculated based on recommendations from The Council of Europe’s EG-TFV task force.",
                "data_type": "float",
                "category": "place",
                "source_type": "",
                "table": "areadata",
                "comparators": DataSet.numerical_comparators()[::-1],
                "is_shadable": True,
                "is_filterable": True,
                "default_value": 1,
                "unit_type": "raw",
                "unit_distribution": "people_in_area",
                "is_public": True,
            },
            "col": "recommended_womens_counselling",
        },
    }

    def get_dataframe(self):
        DATA_TYPE_NAMES = {
            "WMC23": "cons_population",  # as set in import_from_config / imports.json
            "STC": "council_population_count",  # as set in import_council_data
            "DIS": "council_population_count",  # as set in import_council_data
        }

        dt = DataType.objects.get(
            name=DATA_TYPE_NAMES[self.area_type], area_type__code=self.area_type
        )
        ad = AreaData.objects.filter(data_type=dt)

        # fmt: off
        df = pd.DataFrame([
            {
                self.cons_row: row.area.gss,
                self.data_sets["recommended_womens_refuges"]["col"]: row.value() / 10000,
                self.data_sets["recommended_rape_crisis_centres"]["col"]: row.value() / 2 / 200000,
                self.data_sets["recommended_womens_counselling"]["col"]: row.value() / 2 / 50000,
            }
            for row in ad
        ])

        return df
