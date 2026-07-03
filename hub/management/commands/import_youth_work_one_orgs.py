import json
import re
from datetime import date

from django.conf import settings
from django.utils.text import slugify

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet

from .base_importers import BaseAreaImportCommand, MultipleAreaTypesMixin

SOURCE_URL = "https://www.youthworkone.org.uk/datahub"

ORGS_FILE = settings.BASE_DIR / "data" / "youth-work-one-national-orgs.json"
with open(ORGS_FILE) as f:
    ALL_NATIONAL_ORGS = json.load(f)

# Too few of these to be worth a dataset each.
SKIPPED_ORGS = {
    "Sussex Clubs for Young People",
    "Army",
    "MOD",
    "Jewish Lads and Girls Brigade",
    "North Yorkshire Youth",
    "Royal Air Force (RAF)",
}

NATIONAL_ORGS = [org for org in ALL_NATIONAL_ORGS if org["text"] not in SKIPPED_ORGS]

# "<org> groups"/"Number of <org> groups" doesn't read well for every org.
LABEL_OVERRIDES = {
    "Census": "National Youth Sector Census organisations",
    "Local Authority": "Local Authority youth spaces",
}

SCOUTS_ORG_ID = next(org["value"] for org in NATIONAL_ORGS if org["text"] == "Scouts")

# Scouts group names carry a trailing internal record ID, e.g.
# "11th Edgware / Cub Scout 1 (10052441)" - strip it for display.
SCOUTS_ID_SUFFIX = re.compile(r"\s*\(\d+(?:-\d+)?\)\s*$")


def clean_org_name(name, org_id):
    if org_id == SCOUTS_ORG_ID:
        return SCOUTS_ID_SUFFIX.sub("", name).strip()

    return name


def org_slug(name):
    return slugify(name.replace("&", "and")).replace("-", "_")


ORG_SLUGS = {org["value"]: org_slug(org["text"]) for org in NATIONAL_ORGS}


def build_data_sets():
    data_sets = {}
    for org in NATIONAL_ORGS:
        slug = org_slug(org["text"])
        label = LABEL_OVERRIDES.get(org["text"], f"{org['text']} groups")

        list_defaults = {
            "label": label,
            "data_type": "json",
            "category": "movement",
            "subcategory": "groups",
            "release_date": str(date.today()),
            "source_label": "Data from Youth Work One.",
            "source": SOURCE_URL,
            "source_type": "api",
            "table": "areadata",
            "default_value": {},
            "is_filterable": True,
            "is_shadable": False,
            "is_public": True,
            "comparators": DataSet.string_comparators(),
            "unit_type": "point",
            "unit_distribution": "point",
        }

        count_defaults = {
            "label": f"Number of {label}",
            "data_type": "integer",
            "category": "movement",
            "release_date": str(date.today()),
            "source_label": "Data from Youth Work One.",
            "source": SOURCE_URL,
            "source_type": "api",
            "table": "areadata",
            "default_value": 0,
            "is_filterable": True,
            "is_shadable": True,
            "is_public": True,
            "comparators": DataSet.numerical_comparators(),
            "unit_type": "raw",
            "unit_distribution": "physical_area",
        }

        data_sets[f"youth_work_one_{slug}"] = {"defaults": list_defaults}
        data_sets[f"youth_work_one_{slug}_count"] = {"defaults": count_defaults}

    return data_sets


class Command(MultipleAreaTypesMixin, BaseAreaImportCommand):
    help = "Import Youth Work One national organisation locations"
    message = "Importing Youth Work One organisation data"

    data_file = (
        settings.BASE_DIR / "data" / "youth-work-one-org-locations-geocoded.json"
    )

    uses_gss = True
    do_not_convert = True
    area_types = ["WMC23", "STC", "DIS"]
    cons_col_map = {
        "WMC23": "WMC23",
        "STC": "STC",
        "DIS": "DIS",
    }

    data_sets = build_data_sets()

    def get_df(self):
        if not self.data_file.exists():
            return None

        with open(self.data_file) as f:
            rows = json.load(f)

        return pd.DataFrame(rows)

    def process_data(self, df):
        if not self._quiet:
            self.stdout.write(f"{self.message} ({self.area_type})")

        cons_col = self.cons_col_map[self.area_type]
        df = df.dropna(subset=[cons_col])

        groups = df.groupby([cons_col, "nationalOrgId"])
        for (gss, org_id), group in tqdm(groups, disable=self._quiet):
            slug = ORG_SLUGS.get(org_id)
            if slug is None:
                continue

            area = Area.objects.filter(area_type__code=self.area_type, gss=gss).first()
            if area is None:
                continue

            json_list = [
                {"group_name": clean_org_name(name, org_id)}
                for name in group["orgName"]
            ]

            AreaData.objects.update_or_create(
                data_type=self.data_types[f"youth_work_one_{slug}"],
                area=area,
                defaults={"json": json_list},
            )
            AreaData.objects.update_or_create(
                data_type=self.data_types[f"youth_work_one_{slug}_count"],
                area=area,
                defaults={"data": len(group)},
            )
