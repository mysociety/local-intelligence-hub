import re
import unicodedata
from typing import Any

import numpy as np
from pandas import Series, isnull, to_numeric

currency_symbols = "".join(
    chr(i) for i in range(0xFFFF) if unicodedata.category(chr(i)) == "Sc"
)


def parse_and_type_json(json: dict) -> tuple[dict, dict]:
    """
    For all keys in the provided json, if they are numeric or a percentage,
    parse them into ints or floats. Returns a tuple: the parsed data,
    and a map of column name to data type.
    """
    parsed = {}
    column_types = {}
    for key, value in json.items():
        if (numeric_value := parse_as_number(value)) is not None:
            parsed[key] = numeric_value
            column_types[key] = "numeric"
            continue
        if (percentage_value := parse_as_percentage(value)) is not None:
            parsed[key] = percentage_value
            column_types[key] = "percentage"
            continue
        parsed[key] = value
        column_types[key] = "other"
    return parsed, column_types


def merge_column_types(target: dict, extra: dict) -> None:
    for key in extra.keys():
        # Record the data type of this key
        if key not in target:
            target[key] = extra[key]
        # If this key has a variable type, mark as "other"
        elif target[key] != extra[key]:
            target[key] = "other"


def parse_as_number(x: Any) -> int | float | None:
    if isinstance(x, (int, float)):
        return x
    if x == "" or x is None:
        return None
    # check if any numeric values are in the string at all
    x = str(x)
    if not re.search(r"\d", x):
        return None

    x = re.sub(rf"\s|\t|,|^[{currency_symbols}%]|[{currency_symbols}%]$", "", x)

    try:
        return int(x)
    except ValueError:
        try:
            return float(x)
        except ValueError:
            pass

    return None


def parse_as_percentage(x: Any) -> int | float | None:
    if isinstance(x, (int, float)) or x == "" or x is None:
        return None

    x = str(x)
    if x[-1] != "%":
        return None

    x = parse_as_number(x[0:-1])
    if x is not None:
        x = x / 100

    return x


def attempt_interpret_series_as_number(series: Series):
    # Skip parsing if column is already a numeric type
    if np.issubdtype(series.dtype, np.number):
        return series

    # If all values are empty, return None
    if isnull(series).all():
        return None

    # Clean and replace None / empty strings with '0'
    cleaned = (
        series.fillna("")
        .astype(str)
        .str.replace(
            rf"\s|\t|,|^[{currency_symbols}%]|[{currency_symbols}%]$", "", regex=True
        )
        .replace("", "0")
    )

    has_digits = cleaned.str.contains(r"\d")

    if not has_digits.any():
        return None

    # Convert to numeric, handling errors
    try:
        return to_numeric(cleaned)
    except Exception:
        pass

    return None


def attempt_interpret_series_as_percentage(series: Series):
    # If numerically typed, interpret as number, not percentage
    if np.issubdtype(series.dtype, np.number):
        return None

    # If all values are empty, return None
    null_mask = isnull(series)
    if null_mask.all():
        return None

    # Check non-null values for percentage sign at the end
    percentage_mask = series[~null_mask].str.endswith("%")

    # If no percentage signs, return None
    if not percentage_mask.any():
        return None

    # Clean and replace None / empty strings with '0'
    cleaned = (
        series.fillna("")
        .astype(str)
        .str.replace(
            rf"\s|\t|,|^[{currency_symbols}%]|[{currency_symbols}%]$", "", regex=True
        )
        .replace("", "0")
    )

    # Clean and convert to numeric values, then divide by 100
    try:
        return to_numeric(cleaned) / 100
    except Exception:
        pass

    return None


def get_mode(series: Series):
    try:
        return series.mode()[0]
    except KeyError:
        return None
