import re

from django.conf import settings

import pandas as pd

from hub.management.commands.base_importers import BaseImportFromDataFrameCommand
from hub.models import AreaData, AreaType, DataSet, DataType

SUBCATEGORIES_DICT = {
    "would-change-party": "voting",
    "less-favourable-conservative-weaken-climate": "voting",
    "prefer-conservative-leader-invest-renewables": "voting",
    "support-offshore-wind": "renewable_energy",
    "support-onshore-wind": None,
    "support-solar": "renewable_energy",
    "support-tidal": "renewable_energy",
    "support-wave": None,
    "support-nuclear": "renewable_energy",
    "support-local-renewable": None,
    "believe-gov-renewable-invest-increase": "government_action",
    "believe-gov-renewable-should-invest": "government_action",
    "believe-block-onshore-wind": "government_action",
}


class Command(BaseImportFromDataFrameCommand):
    help = "Import polling data about support for renewables"
    message = "Importing polling data about support for renewables"
    data_url = "https://cdn.survation.com/wp-content/uploads/2022/09/06213145/RenewableUK-MRP-Constituency-Topline-.xlsx"
    data_file = settings.BASE_DIR / "data" / "renewables_polling.csv"

    cons_row = "gss"
    column_map = {}
    data_types = {}
    data_sets = {}

    def make_label_from_question(self, q):
        q = re.sub(r"[\d.]+\) ", "", q)
        q = re.sub(r"Percentage of (?:the )?constituency (?:who|that) (?:are )?", "", q)
        q = q.replace(" as energy generation", "")
        q = re.sub(r"(\w)", lambda w: w.group().upper(), q, 1)
        q = q.replace("Govt", "government")

        return q

    def get_dataframe(self):
        df = pd.read_excel(self.data_url)
        df = df.dropna(axis="columns", how="all")

        old_columns = df.columns
        df.columns = (
            "id-name",
            "gss",
            "constituency-name",
            "would-change-party",
            "less-favourable-conservative-weaken-climate",
            "prefer-conservative-leader-invest-renewables",
            "support-offshore-wind",
            "support-onshore-wind",
            "support-solar",
            "support-tidal",
            "support-wave",
            "support-nuclear",
            "support-local-renewable",
            "believe-gov-renewable-invest-increase",
            "believe-gov-renewable-should-invest",
            "believe-block-onshore-wind",
        )

        for key, value in zip(df.columns, old_columns):
            self.column_map[key] = value

        return df

    def add_data_sets(self, df):
        order = 1
        area_type = AreaType.objects.get(code=self.area_type)
        for column in df.columns:
            if column in ("id-name", "gss", "constituency-name"):
                continue

            label = self.make_label_from_question(self.column_map[column])
            defaults = {
                "label": label,
                "data_type": "percent",
                "category": "opinion",
                "subcategory": SUBCATEGORIES_DICT[column],
                "source_label": "Survation MRP polling, commissioned by RenewableUK.",
                "release_date": "September 2022",
                "source": "https://www.renewableuk.com/news/615931/Polling-in-every-constituency-in-Britain-shows-strong-support-for-wind-farms-to-drive-down-bills.htm",
                "source_type": "google sheet",
                "data_url": self.data_url,
                "order": order,
                "table": "areadata",
                "exclude_countries": ["Northern Ireland"],
                "default_value": 50,
                "comparators": DataSet.numerical_comparators(),
                "unit_type": "percentage",
                "unit_distribution": "people_in_area",
            }
            data_set, created = DataSet.objects.update_or_create(
                name=column,
                defaults=defaults,
            )
            self.data_sets[column] = {"defaults": defaults, "col": column}

            data_type, created = DataType.objects.update_or_create(
                data_set=data_set,
                name=column,
                area_type=area_type,
                defaults={
                    "data_type": "percent",
                    "label": label,
                },
            )

            order += 1

            self.data_types[column] = data_type

    def delete_data(self):
        for data_type in self.data_types.values():
            AreaData.objects.filter(data_type=data_type).delete()
