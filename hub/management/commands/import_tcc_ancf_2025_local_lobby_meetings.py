from datetime import date

from django.conf import settings

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet

from .base_importers import BaseConstituencyGroupListImportCommand


class Command(BaseConstituencyGroupListImportCommand):
    help = "Import data about TCC ANCF 2025 local lobby meetings"
    message = "Importing TCC ANCF 2025 local lobby tracker data"

    data_file = settings.BASE_DIR / "data" / "TCC ANCF 2025 Local Lobby Tracker.csv"
    area_type = "WMC23"
    uses_gss = True

    defaults = {
        "label": "Groups involved in Act Now Change Forever local lobby meetings",
        "description": "Community groups across the UK met their MPs as part of The Climate Coalition's Act Now Change Forever campaign in Autumn 2025.",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "release_date": str(date.today()),
        "source_label": "Data from The Climate Coalition.",
        "source": "https://www.theclimatecoalition.org/",
        "source_type": "csv",
        "data_url": "https://www.theclimatecoalition.org/",
        "table": "areadata",
        "default_value": {},
        "is_filterable": False,
        "is_shadable": False,
        "comparators": DataSet.comparators_default(),
        "unit_type": "point",
        "unit_distribution": "point",
    }

    count_defaults = {
        "label": "Number of Act Now Change Forever local lobby meetings",
        "description": "Constituents across the UK met their MPs as part of The Climate Coalition's Act Now Change Forever campaign in Autumn 2025.",
        "data_type": "integer",
        "category": "movement",
        "release_date": str(date.today()),
        "source_label": "Data from The Climate Coalition.",
        "source": "https://www.theclimatecoalition.org/",
        "source_type": "csv",
        "table": "areadata",
        "data_url": "https://www.theclimatecoalition.org/",
        "default_value": 0,
        "is_filterable": True,
        "is_shadable": True,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "raw",
        "unit_distribution": "physical_area",
    }

    data_sets = {
        "tcc_2025_local_lobby_groups": {
            "defaults": defaults,
        },
        "tcc_2025_local_lobby_count": {
            "defaults": count_defaults,
        },
    }

    group_data_type = "tcc_2025_local_lobby_groups"
    count_data_type = "tcc_2025_local_lobby_count"

    def get_df(self):
        if self.data_file.exists() is False:
            return None

        df = pd.read_csv(self.data_file)
        df = df.dropna(subset=["constituency"])
        df["constituency"] = df["constituency"].str.strip()
        # Rename constituency column to gss for the base class
        df = df.rename(columns={"constituency": "gss"})

        return df

    def parse_groups(self, groups_involved):
        """Parse the groups_involved field into a list of group names."""
        if pd.isna(groups_involved) or groups_involved == "":
            return []

        groups = []
        for group in str(groups_involved).replace("\n", ",").split(","):
            group = group.strip()
            if group:
                groups.append(group)
        return groups

    def process_data(self, df: pd.DataFrame):
        """
        Override process_data to handle multiple groups per row.
        The count is the number of meetings (rows), and the groups JSON
        contains all unique groups involved across all meetings.
        """
        if not self._quiet:
            self.stdout.write(f"{self.message} ({self.area_type})")

        for gss, data in tqdm(df.groupby("gss"), disable=self._quiet):
            try:
                area = Area.objects.get(
                    area_type__code=self.area_type,
                    gss=gss,
                )
            except Area.DoesNotExist:
                self.stderr.write(f"no area found for {gss} and {self.area_type}")
                continue

            # Collect all unique groups across all meetings in this constituency
            all_groups = set()
            for index, row in data.iterrows():
                groups = self.parse_groups(row.get("groups_involved", ""))
                all_groups.update(groups)

            # Create JSON list with group_name key for each group
            json_list = [{"group_name": group} for group in sorted(all_groups)]

            # Store the groups JSON
            AreaData.objects.update_or_create(
                data_type=self.data_types[self.group_data_type],
                area=area,
                defaults={"json": json_list},
            )

            # Store the count (number of meetings/rows)
            AreaData.objects.update_or_create(
                data_type=self.data_types[self.count_data_type],
                area=area,
                defaults={"data": len(data)},
            )
