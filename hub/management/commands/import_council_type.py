import pandas as pd

from hub.models import DataSet
from utils import mapit

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin

type_shades = {
    "STC": [
        {"title": "London Borough", "shader": "#ED6832"},
        {"title": "Unitary Council", "shader": "#FEC835"},
        {"title": "Isles of Scilly", "shader": "#068670"},
        {"title": "Northern Ireland Council", "shader": "#21A8E0"},
        {"title": "County Council", "shader": "#6F42C1"},
        {"title": "Metropolitan District", "shader": "#ADB5BD"},
    ],
    "DIS": [
        {"title": "District Council", "shader": "#ADB5BD"},
    ],
}

type_map = {
    "STC": {
        "LBO": "London Borough",
        "UTA": "Unitary Council",
        "COI": "Isles of Scilly",
        "LGD": "Northern Ireland Council",
        "CTY": "County Council",
        "MTD": "Metropolitan District",
    },
    "DIS": {
        "DIS": "District",
    },
}


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    cons_row = "gss-code"
    message = "Importing council type data"
    uses_gss = True
    do_not_convert = True

    area_types = ["STC", "DIS"]

    mapit_types = {
        "STC": ["LBO", "UTA", "COI", "LGD", "CTY", "MTD"],
        "DIS": ["DIS", "NMD"],
    }

    defaults = {
        "data_type": "text",
        "category": "place",
        "subcategory": "",
        "release_date": "February 2023",
        "label": "Council type",
        "source_label": "Data from mySociety.",
        "source": "https://mapit.mysociety.org/",
        "source_type": "api",
        "table": "areadata",
        "default_value": "",
        "data_url": "",
        "comparators": DataSet.in_comparators(),
        "unit_type": "raw",
        "unit_distribution": "",
        "is_shadable": True,
        "is_filterable": True,
        "options": type_shades["STC"],
        "is_public": True,
    }

    data_sets = {
        "council_type": {
            "defaults": defaults,
            "col": "council-type",
        },
    }

    def get_dataframe(self):
        mapit_client = mapit.MapIt()
        areas = mapit_client.areas_of_type(self.mapit_types[self.area_type])
        types = []
        for area in areas:
            types.append(
                {
                    "gss-code": area["codes"]["gss"],
                    "council-type": type_map[self.area_type][area["type"]],
                }
            )

        df = pd.DataFrame(types)

        return df
