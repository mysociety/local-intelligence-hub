from django.conf import settings

from hub.models import DataSet

from .base_importers import BaseConstituencyCountImportCommand


class Command(BaseConstituencyCountImportCommand):
    help = "Import data about number of GBGW events in 2023 per constituency"
    message = "Importing 2023 GBGW events"
    uses_gss = False

    data_file = settings.BASE_DIR / "data" / "gbgw_events_23_processed.csv"
    cons_col = "area"

    data_sets = {
        "constituency_gbgw_2023_event_count": {
            "defaults": {
                "label": "Number of Great Big Green Week 2023 events",
                "release_date": "July 2023",
                "data_type": "integer",
                "category": "movement",
                "subcategory": "events",
                "source_label": "Data from The Climate Coalition.",
                "source": "https://greatbiggreenweek.com/",
                "source_type": "google sheet",
                "data_url": "",
                "table": "areadata",
                "default_value": 10,
                "comparators": DataSet.numerical_comparators(),
                "unit_type": "raw",
                "unit_distribution": "people_in_area",
            }
        }
    }
