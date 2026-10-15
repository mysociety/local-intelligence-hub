"""Shared helpers for importing Sport England's Active Lives Children and
Young People Survey data. See import_active_lives_children_activity_data.py
and import_active_lives_wellbeing_data.py.

Sport England publish this survey as one CSV per question, all sharing the
same (non-standard) "<name> LA"/"<name> CC" council names in their first
column, and all independently suppressing ("-") values for councils with too
few respondents to report reliably.
"""

import pandas as pd

from hub.import_utils import get_council_df
from hub.models import Area, AreaData

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin

SOURCE_URL = "https://www.sportengland.org/research-and-data/data/active-lives"

# Sport England report some very small councils merged into a neighbour, because
# their populations are too small to survey reliably on their own. Apply the
# combined row's value to the larger neighbour only, and leave the smaller one
# (Isles of Scilly, City of London) with no data rather than guessing.
COMBINED_AUTHORITIES = {
    "Cornwall and Isles of Scilly": "Cornwall",
    "Hackney and City of London": "Hackney",
}

# GSS codes for boundary changes the mysoc name/code lookup dataset hasn't
# caught up with yet (same fix as import_neet_data.py / import_absence_exclusion_data.py).
GSS_CODE_REMAP = {
    "E08000016": "E08000038",  # Barnsley
    "E08000019": "E08000039",  # Sheffield
}


def build_name_lookup():
    """Map every name variant of every currently-live council to its GSS code
    and local-authority-type.

    Restricting to live councils (rather than matching against the full
    historical register) avoids misfires where a defunct authority shares a
    name with its unitary replacement, e.g. old Somerset CC vs new Somerset
    Council, or old North Yorkshire CC vs new North Yorkshire Council.
    """
    council_df = get_council_df()
    today = pd.Timestamp.today()
    start = pd.to_datetime(council_df["start-date"])
    live = council_df[(start < today) | start.isna()]
    live = live[(pd.to_datetime(live["end-date"]) > today) | live["end-date"].isna()]
    # Combined authorities/mayoralties aren't councils, and their names can
    # collide with real councils, e.g. "Newcastle upon Tyne" vs the North East
    # Combined Authority.
    live = live[~live["local-authority-type"].isin(["COMB", "SRA"])]

    lookup = {}
    for _, row in live.iterrows():
        names = {row["official-name"], row["nice-name"]}
        if isinstance(row["alt-names"], str):
            names.update(name.strip() for name in row["alt-names"].split(","))
        for name in names:
            if isinstance(name, str) and len(name.strip()) >= 4:
                lookup[name.strip().lower()] = row
    return lookup


def _find(name, lookup):
    row = lookup.get(name.strip().lower())
    if row is None and "," in name:
        # ONS-style "Bristol, City of" naming - try it the other way round too.
        first, second = name.split(",", 1)
        row = lookup.get(f"{second.strip()} {first.strip()}".lower())
    return row


def resolve_council(raw_name, lookup):
    """Resolve a Sport England "<name> LA"/"<name> CC" row name to a live
    council's GSS code and area_type ("STC" or "DIS"), or None if no live
    council matches."""
    name = raw_name
    for suffix in (" LA", " CC"):
        if name.endswith(suffix):
            name = name[: -len(suffix)]
            break

    match = _find(COMBINED_AUTHORITIES.get(name, name), lookup)
    if match is None:
        return None

    gss = GSS_CODE_REMAP.get(match["gss-code"], match["gss-code"])
    area_type = "DIS" if match["local-authority-type"] == "NMD" else "STC"
    return {"gss": gss, "area_type": area_type}


def read_source_table(path):
    """Read a Sport England Active Lives csv into a raw dataframe: column 0
    is the local authority name, columns 1.. are the survey's data columns
    (as strings, with suppressed values as "-"). Some of these files have
    trailing footnote rows, which have fewer columns than the data rows and
    so are padded with NaN - they're dropped naturally later on, since they
    carry no data under any column."""
    return pd.read_csv(path, skiprows=3, header=None)


def read_percent_column(path, column=1):
    """Read one column of a Sport England Active Lives csv as a 0-100
    percentage (suppressed "-" values as NaN), indexed by local authority
    name."""
    df = read_source_table(path)
    percent = pd.to_numeric(df[column].astype(str).str.rstrip("%"), errors="coerce")
    return pd.Series(percent.values, index=df[0])


def read_float_column(path, column=1):
    """Read one column of a Sport England Active Lives csv as a plain number
    (suppressed "-" values as NaN), indexed by local authority name."""
    df = read_source_table(path)
    return pd.Series(pd.to_numeric(df[column], errors="coerce").values, index=df[0])


class ActiveLivesImportCommand(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    """Common machinery for importing Sport England Active Lives council-level
    data: resolving non-standard council names to GSS codes/area types, and
    writing each registered dataset independently of the others, since Sport
    England suppress low-sample values per-column, so a council can have a
    value for one dataset in a shared source file but not another.

    Subclasses must implement `_load_and_resolve()`, returning a DataFrame
    with a "gss" column, an "area_type" column ("STC"/"DIS"), and one column
    per `self.data_sets` entry (named by that entry's "col").
    """

    uses_gss = True
    do_not_convert = True
    area_types = ["STC", "DIS"]

    def _load_and_resolve(self):
        raise NotImplementedError

    def get_dataframe(self):
        if not hasattr(self, "_all_rows"):
            self._all_rows = self._load_and_resolve()

        return self._all_rows[self._all_rows["area_type"] == self.area_type]

    def process_data(self, df):
        if not self._quiet:
            self.stdout.write(f"{self.message} ({self.area_type})")

        for name, conf in self.data_sets.items():
            data_type = self.data_types[name]
            subset = df[["gss", conf["col"]]].dropna()
            for _, row in subset.iterrows():
                area = Area.get_by_gss(row["gss"], area_type=self.area_type)
                if area is None:
                    continue
                AreaData.objects.update_or_create(
                    data_type=data_type,
                    area=area,
                    defaults={"data": row[conf["col"]]},
                )
