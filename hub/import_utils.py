from functools import lru_cache

import pandas as pd
from mysoc_dataset import get_dataset_url

council_types = {"STC": ["CTY", "LBO", "MD", "SCO", "NID", "UA", "WPA"], "DIS": ["NMD"]}


@lru_cache
def get_authority_mapping() -> pd.DataFrame:
    """
    Return a dataframe mapping different names to authority code
    """
    url = get_dataset_url(
        repo_name="uk_local_authority_names_and_codes",
        package_name="uk_la_future",
        version_name="1",
        file_name="lookup_name_to_registry.csv",
        done_survey=True,
    )
    return pd.read_csv(url)


@lru_cache
def get_council_df():
    """
    Return a dataframe of councils that are live or historical as of a given date
    """
    url = get_dataset_url(
        repo_name="uk_local_authority_names_and_codes",
        package_name="uk_la_future",
        version_name="1",
        file_name="uk_local_authorities_future.csv",
        done_survey=True,
    )
    return pd.read_csv(url)


def add_gss_codes(df: pd.DataFrame, code_column: str):
    """
    Given a DataFrame with a column called "authority_code", add a column called "gss_code"
    """
    authority_df = get_council_df()

    rows = len(df[code_column])
    df["gss_code"] = pd.Series([None] * rows, index=df.index)

    for index, row in df.iterrows():
        authority_code = row[code_column]
        if not pd.isnull(authority_code):
            authority_match = authority_df[
                authority_df["local-authority-code"] == authority_code
            ]
            df.at[index, "gss_code"] = authority_match["gss-code"].values[0]

    return df


def _filter_authority_type(df: pd.DataFrame, types: list):
    authority_df = get_council_df()

    rows = len(df["gss_code"])
    df["type"] = pd.Series([None] * rows, index=df.index)
    for index, row in df.iterrows():
        if not pd.isnull("gss_code"):
            authority_match = authority_df[authority_df["gss-code"] == row["gss_code"]]
            df.at[index, "type"] = authority_match["local-authority-type"].values[0]

    df = df.loc[df["type"].isin(types)]

    return df


def filter_authority_type(df: pd.DataFrame, authority_type: str):
    return _filter_authority_type(df, council_types[authority_type])
