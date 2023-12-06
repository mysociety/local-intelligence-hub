from datetime import date

from django.conf import settings

from hub.models import AreaData, DataSet

from .base_importers import BaseConstituencyCountImportCommand


class Command(BaseConstituencyCountImportCommand):
    help = "Import data about number of onshort windfarms of per constituency"

    message = "importing consituency windfarm count"
    uses_gss = True
    cons_col = "gss"
    data_file = settings.BASE_DIR / "data" / "windfarms_per_constituency.csv"

    defaults = {
        "label": "Number of onshore windfarms",
        "description": "Number of onshore windfarms",
        "data_type": "integer",
        "category": "place",
        "release_date": str(date.today()),
        "source_label": "Data from Wikipedia.",
        "source": "https://en.wikipedia.org/wiki/List_of_onshore_wind_farms_in_the_United_Kingdom",
        "source_type": "api",
        "data_url": "https://en.wikipedia.org/wiki/List_of_onshore_wind_farms_in_the_United_Kingdom",
        "table": "areadata",
        "default_value": 10,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "point",
        "unit_distribution": "point",
    }

    data_sets = {
        "constituency_onshore_windfarm_count": {
            "defaults": defaults,
        },
    }

    def delete_data(self):
        for data_type in self.data_types.values():
            AreaData.objects.filter(data_type=data_type).delete()
