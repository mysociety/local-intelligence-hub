from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .active_lives_helpers import (
    SOURCE_URL,
    ActiveLivesImportCommand,
    build_name_lookup,
    read_percent_column,
    resolve_council,
)

DATA_FILES = {
    "weekly": settings.BASE_DIR / "data" / "active-lives-202425-last-week.csv",
    "levels": settings.BASE_DIR / "data" / "active-lives-202425-levels-of-activity.csv",
    "less_active_breakdown": settings.BASE_DIR
    / "data"
    / "active-lives-202425-less-active-breakdown.csv",
}

_common_defaults = {
    "category": "place",
    "source_label": "Data from Sport England's Active Lives Children and Young People Survey.",
    "source": SOURCE_URL,
    "source_type": "csv",
    "data_url": SOURCE_URL,
    "release_date": "2025",
    "data_type": "percent",
    "table": "areadata",
    "comparators": DataSet.numerical_comparators(),
    "unit_type": "percentage",
    "unit_distribution": "people_in_area",
    "is_public": True,
    "fill_blanks": False,
    "exclude_countries": ["Scotland", "Wales", "Northern Ireland"],
}


class Command(ActiveLivesImportCommand):
    help = "Import Active Lives Children and Young People Survey activity data"
    message = "Importing Active Lives children's activity data"

    data_sets = {
        "children_active_once_a_week": {
            "defaults": {
                **_common_defaults,
                "label": "Children active at least once a week",
                "description": "Percentage of children and young people who participated in physical activity at least once a week, academic year 2024/25.",
                "default_value": 90,
            },
            "col": "weekly_pct",
        },
        "children_active_less_than_30_mins_a_day": {
            "defaults": {
                **_common_defaults,
                "label": "Children active less than 30 minutes a day",
                "description": "Percentage of children and young people who averaged less than 30 minutes of physical activity a day, academic year 2024/25.",
                "default_value": 30,
            },
            "col": "less_active_pct",
        },
        "children_active_zero_mins_a_day": {
            "defaults": {
                **_common_defaults,
                "label": "Children active 0 minutes a day",
                "description": 'Percentage of children and young people who averaged 0 minutes of physical activity a day, academic year 2024/25. Calculated from the proportion who are "less active" (average less than 30 minutes a day), and the proportion of that less active group who do 0 minutes a day.',
                "default_value": 8,
            },
            "col": "zero_active_pct",
        },
    }

    def _load_and_resolve(self):
        weekly = read_percent_column(DATA_FILES["weekly"])
        less_active = read_percent_column(DATA_FILES["levels"])
        zero_of_less_active = read_percent_column(DATA_FILES["less_active_breakdown"])

        lookup = build_name_lookup()

        rows = []
        unmatched = []
        for raw_name in weekly.index:
            weekly_pct = weekly[raw_name]
            less_active_pct = less_active[raw_name]
            zero_of_less_active_pct = zero_of_less_active[raw_name]

            if (
                pd.isna(weekly_pct)
                and pd.isna(less_active_pct)
                and pd.isna(zero_of_less_active_pct)
            ):
                continue

            match = resolve_council(raw_name, lookup)
            if match is None:
                unmatched.append(raw_name)
                continue

            if pd.notna(less_active_pct) and pd.notna(zero_of_less_active_pct):
                zero_active_pct = round(
                    less_active_pct * zero_of_less_active_pct / 100, 1
                )
            else:
                zero_active_pct = float("nan")

            rows.append(
                {
                    "gss": match["gss"],
                    "area_type": match["area_type"],
                    "weekly_pct": weekly_pct,
                    "less_active_pct": less_active_pct,
                    "zero_active_pct": zero_active_pct,
                }
            )

        if unmatched:
            self.stderr.write(
                f"Could not match {len(unmatched)} council(s) with data to a "
                f"live GSS code: {sorted(set(unmatched))}"
            )

        return pd.DataFrame(
            rows,
            columns=[
                "gss",
                "area_type",
                "weekly_pct",
                "less_active_pct",
                "zero_active_pct",
            ],
        )
