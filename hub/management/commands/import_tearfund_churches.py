from django.conf import settings

from hub.models import AreaData, DataSet

from .base_importers import BaseConstituencyCountImportCommand


class Command(BaseConstituencyCountImportCommand):
    help = "Import data about number of churches who have declared a climate emergency"

    message = "importing churches with a declared climate emergency count"
    uses_gss = True
    cons_col = "gss"
    data_file = settings.BASE_DIR / "data" / "tearfund_churches_processed.csv"

    defaults = {
        "label": "Churches Who've Declared a Climate Emergency",
        "description": "Number of churches who've declared a climate emergency",
        "data_type": "integer",
        "category": "place",
        "source_label": "Tearfund",
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
