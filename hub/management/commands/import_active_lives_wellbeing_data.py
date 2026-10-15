from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .active_lives_helpers import (
    SOURCE_URL,
    ActiveLivesImportCommand,
    build_name_lookup,
    read_float_column,
    read_percent_column,
    resolve_council,
)

DATA_FILES = {
    "wellbeing": settings.BASE_DIR
    / "data"
    / "active-lives-202425-mental-wellbeing.csv",
    "loneliness": settings.BASE_DIR / "data" / "active-lives-202425-loneliness.csv",
    "trust": settings.BASE_DIR / "data" / "active-lives-202425-trust-in-peers.csv",
}

_common_defaults = {
    "category": "opinion",
    "source_label": "Data from Sport England's Active Lives Children and Young People Survey.",
    "source": SOURCE_URL,
    "source_type": "csv",
    "data_url": SOURCE_URL,
    "release_date": "2025",
    "table": "areadata",
    "comparators": DataSet.numerical_comparators(),
    "unit_type": "raw",
    "unit_distribution": "people_in_area",
    "is_public": True,
    "fill_blanks": False,
    "exclude_countries": ["Scotland", "Wales", "Northern Ireland"],
}

_wellbeing_defaults = {
    **_common_defaults,
    "data_type": "float",
}

_trust_defaults = {
    **_common_defaults,
    "data_type": "percent",
    "unit_type": "percentage",
    "data_set_name": "children_trust_in_peers",
    "data_set_label": "Children’s trust in their peers",
    "description": "Percentage of 3–11 year olds saying that they can trust people of a similar age to themselves, broken down by how much they trust them, academic year 2024/25.",
    "is_range": True,
    "default_value": 25,
}


class Command(ActiveLivesImportCommand):
    help = "Import Active Lives Children and Young People Survey wellbeing, loneliness and trust data"
    message = "Importing Active Lives children’s wellbeing data"

    data_sets = {
        "children_happiness": {
            "defaults": {
                **_wellbeing_defaults,
                "label": "Average child happiness out of 10",
                "description": "Average reported happiness, on a scale of 0-10, among 3–11 year old children, academic year 2024/25.",
                "default_value": 7,
            },
            "col": "happiness",
        },
        "children_satisfaction": {
            "defaults": {
                **_wellbeing_defaults,
                "label": "Average child life satisfaction out of 10",
                "description": "Average reported life satisfaction, on a scale of 0-10, among 7–11 year old children, academic year 2024/25.",
                "default_value": 7,
            },
            "col": "satisfaction",
        },
        "children_worthwhileness": {
            "defaults": {
                **_wellbeing_defaults,
                "label": "Average child life worthwhileness out of 10",
                "description": "Average reported life worthwhileness, on a scale of 0-10, among 7–11 year old children, academic year 2024/25.",
                "default_value": 7,
            },
            "col": "worthwhileness",
        },
        "children_loneliness": {
            "defaults": {
                **_common_defaults,
                "data_type": "percent",
                "unit_type": "percentage",
                "label": "Children ‘often or always’ lonely",
                "description": "Percentage of 7–11 year olds who reported feeling “often or always” lonely, academic year 2024/25. Low sample numbers mean this data is only available for a subset of councils.",
                "default_value": 12,
            },
            "col": "loneliness_pct",
        },
        "children_trust_a_lot": {
            "defaults": {
                **_trust_defaults,
                "label": "Can trust them a lot",
                "order": 1,
            },
            "col": "trust_a_lot_pct",
        },
        "children_trust_a_bit": {
            "defaults": {
                **_trust_defaults,
                "label": "Can trust them a bit",
                "order": 2,
            },
            "col": "trust_a_bit_pct",
        },
        "children_trust_not_very_much": {
            "defaults": {
                **_trust_defaults,
                "label": "Can’t trust them very much",
                "order": 3,
            },
            "col": "trust_not_much_pct",
        },
        "children_trust_not_at_all": {
            "defaults": {
                **_trust_defaults,
                "label": "Can’t trust them at all",
                "order": 4,
            },
            "col": "trust_not_at_all_pct",
        },
    }

    def _load_and_resolve(self):
        happiness = read_float_column(DATA_FILES["wellbeing"], column=1)
        satisfaction = read_float_column(DATA_FILES["wellbeing"], column=2)
        worthwhileness = read_float_column(DATA_FILES["wellbeing"], column=3)
        loneliness_pct = read_percent_column(DATA_FILES["loneliness"], column=1)
        trust_a_lot_pct = read_percent_column(DATA_FILES["trust"], column=1)
        trust_a_bit_pct = read_percent_column(DATA_FILES["trust"], column=2)
        trust_not_much_pct = read_percent_column(DATA_FILES["trust"], column=3)
        trust_not_at_all_pct = read_percent_column(DATA_FILES["trust"], column=4)

        columns = {
            "happiness": happiness,
            "satisfaction": satisfaction,
            "worthwhileness": worthwhileness,
            "loneliness_pct": loneliness_pct,
            "trust_a_lot_pct": trust_a_lot_pct,
            "trust_a_bit_pct": trust_a_bit_pct,
            "trust_not_much_pct": trust_not_much_pct,
            "trust_not_at_all_pct": trust_not_at_all_pct,
        }

        # All three source files share the same (non-standard) council names,
        # so any of them gives us the full list of names to resolve - but
        # take the union, in case any file is ever missing a row the others have.
        all_names = set()
        for series in columns.values():
            all_names.update(series.index)

        lookup = build_name_lookup()

        rows = []
        unmatched = []
        for raw_name in all_names:
            values = {col: series.get(raw_name) for col, series in columns.items()}
            if all(pd.isna(v) for v in values.values()):
                continue

            match = resolve_council(raw_name, lookup)
            if match is None:
                unmatched.append(raw_name)
                continue

            rows.append(
                {"gss": match["gss"], "area_type": match["area_type"], **values}
            )

        if unmatched:
            self.stderr.write(
                f"Could not match {len(unmatched)} council(s) with data to a "
                f"live GSS code: {sorted(set(unmatched))}"
            )

        return pd.DataFrame(rows, columns=["gss", "area_type", *columns.keys()])
