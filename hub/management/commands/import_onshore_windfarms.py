from datetime import date

from django.conf import settings

from hub.models import AreaData, DataSet

from .base_importers import BaseConstituencyCountImportCommand, MultipleAreaTypesMixin


class Command(MultipleAreaTypesMixin, BaseConstituencyCountImportCommand):
    help = "Import data about number of onshort windfarms of per constituency"

    message = "importing consituency windfarm count"
    uses_gss = True
    cons_col = "gss"
    data_file = settings.BASE_DIR / "data" / "windfarms_per_constituency.csv"

    area_types = ["WMC", "WMC23", "STC", "DIS"]
    cons_col_map = {
        "WMC": "WMC",
        "WMC23": "WMC23",
        "STC": "STC",
        "DIS": "DIS",
    }

    defaults = {
        "label": "Number of onshore windfarms",
        "data_type": "integer",
        "category": "place",
        "release_date": str(date.today()),
        "source_label": "Data from Wikipedia.",
        "source": "https://en.wikipedia.org/wiki/List_of_onshore_wind_farms_in_the_United_Kingdom",
        "source_type": "api",
        "data_url": "https://en.wikipedia.org/wiki/List_of_onshore_wind_farms_in_the_United_Kingdom",
        "table": "areadata",
        "default_value": 10,
        "is_filterable": True,
        "is_shadable": True,
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
