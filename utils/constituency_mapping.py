"""
This file has been taken from:
https://github.com/mysociety/climate_mrp_polling/blob/8fa3f0dea764297e9644536f4abb8506a248dc37/src/climate_mrp_polling/convert_polling.py
with alterations to make it run in Python 3.8, and also not require parquet functionality


This file is a standlone library to convert polling data from one geography to another.
It has minimal dependencies beyond pandas.
Ideally it uses parquet and pyarrow - but if this is an obstacle,
adjust the parquet references to csv.

Note, when converting to LAD23, this is the lower level geography.

Additional conversion for higher level is in convert_specific_polling.py
in the climate_mrp_polling package.

This could in principle be bundled into a quick command-line tool if useful.

"""

from typing import Literal, get_args

import pandas as pd

ValidGeographies = Literal["LSOA11", "PARL10", "PARL25", "LAD23"]
DataValues = Literal["percentage", "absolute"]
OverlapTypes = Literal["area", "population"]


def get_dataset_url(
    repo_name: str, package_name: str, version_name: str, file_name: str
):
    """
    Get url to a dataset from the pages.mysociety.org website.
    """
    return f"https://pages.mysociety.org/{repo_name}/data/{package_name}/{version_name}/{file_name}"


def get_overlap_df(
    input_geography: ValidGeographies, output_geography: ValidGeographies
) -> pd.DataFrame:
    """
    Get a df from the mySociety repo with the percentage overlap between geographies
    """

    url = get_dataset_url(
        repo_name="2025-constituencies",
        package_name="geographic_overlaps",
        version_name="latest",
        file_name=f"{input_geography}_{output_geography}_combo_overlap.csv",
    )

    return pd.read_csv(url)


def convert_data_geographies(
    df: pd.DataFrame,
    *,
    input_geography: ValidGeographies,
    output_geography: ValidGeographies,
    overlap_measure: OverlapTypes = "population",
    input_code_col: "str | None" = None,
    output_code_col: "str | None" = None,
    input_values_type: DataValues = "percentage",
    output_values_type: "DataValues | None" = None,
) -> pd.DataFrame:
    """
    Convert data from one geography to another.
    Works best when output geographies are bigger (e.g. parl cons to LAs).
    Expects a dataframe with the first column being the input geography codes.
    All other columns are assumed to be ready to be converted.

    It will return an output dataframe with the first column
    being the output geography codes.
    """

    # validate inputs
    if input_code_col is None:
        input_code_col = input_geography
    if output_code_col is None:
        output_code_col = output_geography
    if output_values_type is None:
        output_values_type = input_values_type

    if input_geography not in (o := get_args(ValidGeographies)):
        raise ValueError(
            f"input geography {input_geography} not valid. Expected one of {o}"
        )

    if output_geography not in (o := get_args(ValidGeographies)):
        raise ValueError(
            f"output geography {output_geography} not valid. Expected one of {o}"
        )

    if input_code_col not in df.columns:
        raise ValueError(f"input geography {input_code_col} not in dataframe")

    if input_values_type not in get_args(DataValues):
        raise ValueError("values must be either 'percentage' or 'absolute'")

    if output_values_type not in get_args(DataValues):
        raise ValueError("values must be either 'percentage' or 'absolute'")

    # get correct overlap column
    if overlap_measure == "population":
        overlap_column = "percentage_overlap_pop"
    elif overlap_measure == "area":
        overlap_column = "percentage_overlap_area"
    else:
        raise ValueError("overlap_measure must be either 'population' or 'area'")

    # input_code_col needs to be the first column, raise error if not
    if df.columns[0] != input_code_col:
        raise ValueError(f"input geography {input_code_col} must be first column")

    if overlap_measure == "population":
        overlap_column = "overlap_pop"
    elif overlap_measure == "area":
        overlap_column = "overlap_area"
    else:
        raise ValueError("overlap_measure must be either 'population' or 'area'")

    # fetch the geography intersepction lookup file
    overlap_df = get_overlap_df(input_geography, output_geography)

    original_columns = list(df.columns)[1:]
    df = df.merge(
        overlap_df, how="left", left_on=input_code_col, right_on=input_geography
    )

    if input_values_type == "absolute":
        # if we've been given raw people
        # convert them into percentage ([absolute]/[total pop])
        # similarly if this is an area based measure
        # this is now a number representing [absolute]/[square ms]
        for c in original_columns:
            df[c] = df[c] / df["original_pop"]

    for c in original_columns:
        # taking our fractional values for the original geography we need to express
        # this as an absolute of the current fragment we are in
        df[c] = df[c].astype(float) * df[overlap_column]
        # this is now a unit of [original absolute unit] expected in this fragment
        # assuming it was evenly distributed across either area/population

    # now we need to aggregate by the output geography
    # to get the total absolute unit for each output geography
    # at the same time, we're aggregating the overlap column
    # to get the total new geography pop/area

    final = df.groupby(output_geography).agg("sum", numeric_only=False)

    # if we want percentages, reconvert based on the summed overlap value
    # (which should roughly add up to the output geography area)

    if output_values_type == "percentage":
        for c in original_columns:
            # percentage of total
            final[c] = final[c] / final[overlap_column]

    final = (
        final[original_columns]
        .reset_index()
        .rename(columns={output_geography: output_code_col})
    )

    return final
