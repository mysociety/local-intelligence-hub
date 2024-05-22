from mysoc_dataset import get_dataset_df

from hub.import_utils import add_gss_codes, filter_authority_type
from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    message = "Importing council MRP data"
    uses_gss = True
    do_not_convert = True
    cons_row = "gss_code"

    area_types = ["STC", "DIS"]

    defaults = {
        "data_type": "integer",
        "category": "opinion",
        "source_label": "Public First MRP Polling, commissioned by Onward UK, adjusted for the demographics of the local area by mySociety.",
        "release_date": "July 2022",
        "source": "https://www.publicfirst.co.uk/new-public-first-polling-for-onward.html",
        "source_type": "google sheet",
        "subcategory": "net_zero_support",
        "table": "areadata",
        "default_value": 10,
        "data_url": "",
        "exclude_countries": ["Northern Ireland"],
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    }

    survation_defaults = {
        "data_type": "percent",
        "category": "opinion",
        "source_label": "Survation MRP polling, commissioned by RenewableUK, adjusted for the demographics of the local area by mySociety.",
        "release_date": "September 2022",
        "source": "https://www.renewableuk.com/news/615931/Polling-in-every-constituency-in-Britain-shows-strong-support-for-wind-farms-to-drive-down-bills.htm",
        "source_type": "google sheet",
        "table": "areadata",
        "exclude_countries": ["Northern Ireland"],
        "default_value": 50,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    }

    data_sets = {
        "constituency_nz_support": {
            "defaults": {
                **defaults,
                "label": "Support Net Zero",
            },
            "col": "Q02_Support",
        },
        "constituency_nz_neutral": {
            "defaults": {
                **defaults,
                "label": "Neither support nor oppose Net Zero",
            },
            "col": "Q02_Neutral",
        },
        "constituency_nz_oppose": {
            "defaults": {**defaults, "label": "Oppose Net Zero"},
            "col": "Q02_Oppose",
        },
        "constituency_cc_high": {
            "defaults": {
                **defaults,
                "label": "Consider climate change a high priority",
            },
            "col": "Q07_High",
        },
        "support-offshore-wind": {
            "defaults": {
                **survation_defaults,
                "label": "Support offshore wind",
                "subcategory": "renewable_energy",
                "order": 1,
            },
            "col": "Q4.1",
        },
        "support-onshore-wind": {
            "defaults": {
                **survation_defaults,
                "label": "Support onshore wind",
                "subcategory": None,
                "order": 2,
            },
            "col": "Q4.2",
        },
        "support-solar": {
            "defaults": {
                **survation_defaults,
                "label": "Support solar power",
                "subcategory": "renewable_energy",
                "order": 3,
            },
            "col": "Q4.3",
        },
        "support-tidal": {
            "defaults": {
                **survation_defaults,
                "label": "Support tidal energy",
                "subcategory": "renewable_energy",
                "order": 4,
            },
            "col": "Q4.4",
        },
        "support-wave": {
            "defaults": {
                **survation_defaults,
                "label": "Support wave energy",
                "subcategory": None,
                "order": 5,
            },
            "col": "Q4.5",
        },
        "support-nuclear": {
            "defaults": {
                **survation_defaults,
                "label": "Support nuclear energy",
                "subcategory": "renewable_energy",
                "order": 6,
            },
            "col": "Q4.6",
        },
        "support-local-renewable": {
            "defaults": {
                **survation_defaults,
                "label": "Support renewable energy projects in their local area",
                "subcategory": None,
                "order": 7,
            },
            "col": "Q5",
        },
    }
    del data_sets["constituency_cc_high"]["defaults"]["subcategory"]

    def get_row_data(self, row, conf):
        return row[conf["col"]] * 100

    def get_dataframe(self):
        df = get_dataset_df(
            repo_name="climate_mrp_polling",
            package_name="local_authority_climate_polling",
            version_name="latest",
            file_name="local_authority_climate_polling.csv",
            done_survey=True,
        )

        df = add_gss_codes(df, "local-authority-code")
        df = filter_authority_type(df, self.area_type, self.cons_row)
        df = df.pivot(
            index="gss_code", columns="question", values="percentage"
        ).reset_index()

        return df
