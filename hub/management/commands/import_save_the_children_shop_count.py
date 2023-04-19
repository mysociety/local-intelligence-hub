from django.conf import settings

from hub.models import AreaData, DataSet

from .base_importers import BaseConstituencyCountImportCommand


class Command(BaseConstituencyCountImportCommand):
    help = "Import data about the number of Save the Children shops per constituency"

    message = "importing Save the Children shop count"
    uses_gss = True
    cons_col = "gss"
    data_file = settings.BASE_DIR / "data" / "save_the_children_shops_processed.csv"

    source_date = "November 2022"

    defaults = {
        "label": "Number of Save the Children shops",
        "description": "Number of Save the Children shops",
        "data_type": "integer",
        "category": "movement",
        "subcategory": "places_and_spaces",
        "source_label": "Save the Children",
        "source_date": source_date,
        "source": "https://www.savethechildren.org.uk/",
        "source_type": "csv",
        "data_url": "",
        "table": "areadata",
        "default_value": 10,
        "comparators": DataSet.numerical_comparators(),
    }

    data_sets = {
        "save_the_children_shops_count": {
            "defaults": defaults,
        },
    }

    def delete_data(self):
        for data_type in self.data_types.values():
            AreaData.objects.filter(data_type=data_type).delete()
