from collections.abc import Generator
from contextlib import contextmanager
from datetime import date
from functools import lru_cache

from django.core.management.base import BaseCommand
from django.db.transaction import atomic

import pandas as pd
from mysoc_dataset import get_dataset_url

council_types = {"STC": ["CTY", "LBO", "MD", "SCO", "NID", "UA", "WPA"], "DIS": ["NMD"]}


# from https://adamj.eu/tech/2022/10/13/dry-run-mode-for-data-imports-in-django/
class DoRollback(Exception):
    pass


@contextmanager
def rollback_atomic() -> Generator[None, None, None]:
    try:
        with atomic():
            yield
            raise DoRollback()
    except DoRollback:
        pass


class BaseTransactionCommand(BaseCommand):
    def get_atomic_context(self, commit):
        if commit:
            atomic_context = atomic()
        else:
            atomic_context = rollback_atomic()

        return atomic_context


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


def _filter_authority_type(df: pd.DataFrame, types: list, gss_code: str):
    authority_df = get_council_df()

    today = date.today()

    rows = len(df[gss_code])
    df["type"] = pd.Series([None] * rows, index=df.index)
    df["start-date"] = pd.Series([None] * rows, index=df.index)
    df["end-date"] = pd.Series([None] * rows, index=df.index)
    for index, row in df.iterrows():
        if not pd.isnull(row[gss_code]):
            authority_match = authority_df[authority_df["gss-code"] == row[gss_code]]
            df.at[index, "type"] = authority_match["local-authority-type"].values[0]
            df.at[index, "start-date"] = pd.to_datetime(
                authority_match["start-date"].values[0]
            ).date()
            df.at[index, "end-date"] = pd.to_datetime(
                authority_match["end-date"].values[0]
            ).date()

    df = df.loc[df["type"].isin(types)]

    # only select authorities with a start date in the past
    df = df.loc[(df["start-date"] < today) | df["start-date"].isna()]

    # only select authorities with an end date in the future
    df = df.loc[(df["end-date"] > today) | df["end-date"].isna()]

    return df


def filter_authority_type(
    df: pd.DataFrame, authority_type: str, gss_code: str = "gss-code"
):
    return _filter_authority_type(df, council_types[authority_type], gss_code)
