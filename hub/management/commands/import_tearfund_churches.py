from django.conf import settings

from hub.models import AreaData, DataSet

from .base_importers import BaseConstituencyCountImportCommand


class Command(BaseConstituencyCountImportCommand):
    help = "Import data about number of churches that have declared a climate emergency"

    message = "importing churches with a declared climate emergency count"
    uses_gss = True
    cons_col = "gss"
    data_file = settings.BASE_DIR / "data" / "tearfund_churches_processed.csv"

    source_date = "November 2022"

    defaults = {
        "label": "Churches that have declared a climate emergency",
        "description": "Number of churches that have declared a climate emergency",
        "data_type": "integer",
        "category": "movement",
        "subcategory": "places_and_spaces",
        "source_label": "Tearfund",
        "source_date": source_date,
        "source": "https://www.tearfund.org/",
        "source_type": "csv",
        "data_url": "",
        "table": "areadata",
        "default_value": 10,
        "comparators": DataSet.numerical_comparators(),
    }

    data_sets = {
        "tearfund_churches": {
            "defaults": defaults,
        },
    }

    def delete_data(self):
        for data_type in self.data_types.values():
            AreaData.objects.filter(data_type=data_type).delete()
