from django.conf import settings

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet

from .base_importers import BaseConstituencyGroupListImportCommand

# Fix up some messy (pre-2024) constituency names. An empty list means
# “skip this constituency”, eg because its successor(s) are already
# listed on every row where it appears.
CONSTITUENCY_FIXES = {
    "N/A": [],
    "Bosworth": ["Hinckley and Bosworth"],
    "Charnwood": ["Mid Leicestershire"],
    "Chertsey and Walton": [],  # Runnymede and Weybridge, Esher and Walton
    "Denton and Reddish": [],  # Gorton and Denton, Stockport
    "East Devon": ["Exmouth and Exeter East"],
    "Elmet and Rothwell": ["Wetherby and Easingwold"],
    "Garston and Halewood": ["Liverpool Garston"],
    "Islington South": ["Islington South and Finsbury"],
    "Radcliffe and Bury West": [],  # Bury North
    "Wentworth and Dearne": ["Rawmarsh and Conisbrough"],
}


class Command(BaseConstituencyGroupListImportCommand):
    help = "Import climate action groups from the 2026 Local Climate Action Survey"
    message = "Importing Local Climate Action Survey groups"

    data_file = settings.BASE_DIR / "data" / "2026-climate-action-england-survey.csv"
    area_type = "WMC23"

    name_col = "What is your organisation's name?"
    cons_col = "TIDIED UP CONSTITUENCIES (5th August)"
    url_col_prefix = "Website"

    defaults = {
        "label": "2026 Local Climate Action Survey respondents",
        "description": "Local climate action groups, centres and networks in England that responded to The Climate Coalition’s 2026 survey of 600 climate organisations in England.",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "release_date": "August 2026",
        "source_label": "Data collected by The Climate Coalition and Community Environment Associates (CEA).",
        "source": "https://www.theclimatecoalition.org/the_quiet_engine_of_climate_action",
        "source_type": "csv",
        "data_url": "",
        "table": "areadata",
        "default_value": {},
        "exclude_countries": ["Scotland", "Wales", "Northern Ireland"],
        "is_filterable": False,
        "is_shadable": False,
        "is_public": True,
        "comparators": DataSet.comparators_default(),
        "unit_type": "point",
        "unit_distribution": "point",
    }

    count_defaults = {
        **defaults,
        "label": "Number of climate action groups",
        "data_type": "integer",
        "default_value": 0,
        "is_filterable": True,
        "is_shadable": True,
        "comparators": DataSet.numerical_comparators(),
    }

    data_sets = {
        "tcc_2026_survey_groups": {
            "defaults": defaults,
        },
        "tcc_2026_survey_group_count": {
            "defaults": count_defaults,
        },
    }

    group_data_type = "tcc_2026_survey_groups"
    count_data_type = "tcc_2026_survey_group_count"

    def clean_url(self, url):
        if pd.isna(url):
            return None
        url = str(url).strip()
        if " " in url or "." not in url: # eg: "No website"
            return None
        url = url[0].lower() + url[1:] # fix auto-capitalisations
        if not url.lower().startswith(("http://", "https://")):
            url = f"https://{url}"
        return url

    def split_constituencies(self, value):
        if pd.isna(value):
            return []
        constituencies = []
        for name in str(value).split(";"):
            name = name.strip()
            if name:
                constituencies.extend(CONSTITUENCY_FIXES.get(name, [name]))
        return constituencies

    def get_df(self):
        if not self.data_file.exists():
            return None

        df = pd.read_csv(self.data_file)
        url_col = next(c for c in df.columns if c.startswith(self.url_col_prefix))
        df = df[[self.name_col, self.cons_col, url_col]]
        df.columns = ["group_name", "constituency", "url"]

        df["group_name"] = df["group_name"].str.strip()
        df["url"] = df["url"].apply(self.clean_url)
        df["constituency"] = df["constituency"].apply(self.split_constituencies)

        df = df.dropna(subset=["group_name"]).explode("constituency")
        df = df.dropna(subset=["constituency"])

        # Some groups responded more than once, so keep one row per group
        # per constituency, preferring a row with a URL.
        df = df.sort_values("url", na_position="last").drop_duplicates(
            subset=["group_name", "constituency"]
        )

        return df

    def get_group_json(self, row):
        return row[["group_name", "url"]].dropna().to_dict()

    def process_data(self, df: pd.DataFrame):
        if not self._quiet:
            self.stdout.write(f"{self.message} ({self.area_type})")

        for name, data in tqdm(df.groupby("constituency"), disable=self._quiet):
            area = Area.get_by_name(name, area_type=self.area_type)
            if area is None:
                self.stderr.write(f"no area found for {name} and {self.area_type}")
                continue

            json = [
                self.get_group_json(row)
                for _, row in data.sort_values("group_name").iterrows()
            ]

            AreaData.objects.update_or_create(
                data_type=self.data_types[self.group_data_type],
                area=area,
                defaults={"json": json},
            )
            AreaData.objects.update_or_create(
                data_type=self.data_types[self.count_data_type],
                area=area,
                defaults={"data": len(json)},
            )
