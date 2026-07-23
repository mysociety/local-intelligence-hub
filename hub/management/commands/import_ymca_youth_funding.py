import json

from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .active_lives_helpers import GSS_CODE_REMAP, _find, build_name_lookup
from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin

SOURCE_URL = "https://ymca.org.uk/stateofplay/"

# A handful of councils in the YMCA data don't resolve via the mysoc name
# register - mostly non-standard suffixes ("X Council" rather than the
# official "X Borough/Metropolitan Borough Council"), or Welsh-language
# names the register doesn't carry as an alt-name.
GSS_NAME_OVERRIDES = {
    "blackpool council": "E06000009",
    "kingston upon hull city council": "E06000010",
    "middlesbrough council": "E06000002",
    "redcar and cleveland council": "E06000003",
    "southend-on-sea city council": "E06000033",
    "enfield council": "E09000010",
    "wandsworth borough council": "E09000032",
    "westminster city council": "E09000033",
    "south tyneside metropolitan borough council": "E08000023",
    "newcastle upon tyne city council": "E08000021",
    "wirral metropolitan borough council": "E08000015",
    "cyngor gwynedd": "W06000002",
    "city and county of swansea": "W06000011",
    "vale of glamorgan county borough council": "W06000014",
    "cyngor sir ynys mon": "W06000001",
}


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    help = "Import YMCA 'State of Play' youth service spending data"
    message = "Importing YMCA youth spending data"

    data_file = settings.BASE_DIR / "data" / "ymca-youth-funding.json"
    cons_row = "gss"
    uses_gss = True
    area_types = ["STC"]
    do_not_convert = True

    spend_defaults = {
        "label": "Local Authority youth spending per person",
        "data_type": "float",
        "category": "place",
        "release_date": "February 2026",
        "source_label": "Data from YMCA’s ‘State of Play’ report.",
        "source": SOURCE_URL,
        "source_type": "api",
        "table": "areadata",
        "default_value": 0,
        "is_filterable": True,
        "is_shadable": True,
        "is_public": True,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
        "exclude_countries": ["Scotland", "Northern Ireland"],
    }

    change_defaults = {
        "label": "Change in Local Authority youth spending since 2010",
        "data_type": "percent",
        "category": "place",
        "release_date": "February 2026",
        "source_label": "Data from YMCA’s ‘State of Play’ report.",
        "source": SOURCE_URL,
        "source_type": "api",
        "table": "areadata",
        "default_value": 0,
        "is_filterable": True,
        "is_shadable": True,
        "is_public": True,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
        "exclude_countries": ["Scotland", "Northern Ireland"],
    }

    data_sets = {
        "ymca_youth_spend_per_person": {
            "defaults": spend_defaults,
            "col": "spend",
        },
        "ymca_youth_spend_change_since_2010": {
            "defaults": change_defaults,
            "col": "change",
        },
    }

    def resolve_gss(self, organization, lookup):
        normalised = organization.replace(" & ", " and ")

        override = GSS_NAME_OVERRIDES.get(normalised.strip().lower())
        if override:
            return override

        match = _find(normalised, lookup)
        if match is None:
            return None

        return GSS_CODE_REMAP.get(match["gss-code"], match["gss-code"])

    def get_dataframe(self):
        if not self.data_file.exists():
            return None

        with open(self.data_file) as f:
            raw = json.load(f)

        rows = [{c["name"]: c["value"] for c in row["columns"]} for row in raw["rows"]]
        df = pd.DataFrame(rows)

        # Non-metropolitan district councils, and councils in Scotland/NI,
        # carry no youth spending figures in this data - Sport England-style
        # blank strings rather than missing rows.
        df = df[df["COLUMN1"] != ""]

        lookup = build_name_lookup()
        df["gss"] = df["organization"].apply(lambda org: self.resolve_gss(org, lookup))

        unresolved = df[df["gss"].isna()]
        for org in unresolved["organization"]:
            self.stdout.write(f"no council match for {org}")
        df = df.dropna(subset=["gss"])

        df["spend"] = df["COLUMN1"].astype(float)
        df["change"] = df["COLUMN2"].astype(float)

        return df
