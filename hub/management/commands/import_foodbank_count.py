from django.conf import settings

from hub.models import AreaData, DataSet

from .base_importers import BaseConstituencyCountImportCommand


class Command(BaseConstituencyCountImportCommand):
    help = "Import data about number of foodbanks of per constituency"

    message = "importing consituency foodbank count"
    uses_gss = True
    cons_col = "gss"
    data_file = settings.BASE_DIR / "data" / "foodbanks_per_constituency.csv"

    defaults = {
        "label": "Number of Trussell Trust foodbanks",
        "description": "Number of Trussell Trust foodbanks per constituency.",
        "data_type": "integer",
        "category": "movement",
        "release_date": "December 2022",
        "source_label": "Data from Trussell Trust.",
        "source": "https://www.trusselltrust.org/",
        "source_type": "csv",
        "data_url": "",
        "table": "areadata",
        "default_value": 10,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    }

    data_sets = {
        "constituency_foodbank_count": {
            "defaults": defaults,
        },
    }

    def delete_data(self):
        for data_type in self.data_types.values():
            AreaData.objects.filter(data_type=data_type).delete()
