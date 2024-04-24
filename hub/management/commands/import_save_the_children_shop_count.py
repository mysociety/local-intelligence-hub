from django.conf import settings

from hub.models import AreaData, DataSet

from .base_importers import BaseConstituencyCountImportCommand, MultipleAreaTypesMixin


class Command(MultipleAreaTypesMixin, BaseConstituencyCountImportCommand):
    help = "Import data about the number of Save the Children shops per constituency"

    message = "importing Save the Children shop count"
    uses_gss = True
    data_file = settings.BASE_DIR / "data" / "save_the_children_shops_processed.csv"

    area_types = ["WMC", "WMC23", "STC", "DIS"]
    cons_col_map = {
        "WMC": "WMC",
        "WMC23": "WMC23",
        "STC": "STC",
        "DIS": "DIS",
    }
    defaults = {
        "label": "Number of Save the Children shops",
        "data_type": "integer",
        "category": "movement",
        "subcategory": "places_and_spaces",
        "source_label": "Data from Save the Children.",
        "release_date": "July 2023",
        "source": "https://www.savethechildren.org.uk/",
        "source_type": "csv",
        "data_url": "",
        "table": "areadata",
        "default_value": 10,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    }

    data_sets = {
        "save_the_children_shops_count": {
            "defaults": defaults,
        },
    }

    def delete_data(self):
        for data_type in self.data_types.values():
            AreaData.objects.filter(data_type=data_type).delete()
