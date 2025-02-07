import locale

from pandas import DataFrame, Series


def attempt_interpret_series_as_float(df: DataFrame):
    if all(df.apply(check_numeric)):
        # Whole value replacement
        df = df.replace("", 0)
        # Substring replacement
        df = df.str.replace("%", "")
        df = df.astype(float)
    return df


def attempt_interpret_series_as_percentage(df: DataFrame):
    if all(df.apply(check_percentage)):
        df = df.replace("", 0)
        # Substring replacement
        df = df.str.replace("%", "")
        # Divide by 100
        df = df.astype(float) / 100
    return df


def check_numeric(x):
    try:
        if x == "" or x is None:
            return True
        # if has a trailing %, remove it
        if x[-1] == "%":
            x = x[:-1]
        var = locale.atof(x)
        var = float(var)
        # check type is numeric
        return isinstance(var, (int, float))
    except Exception:
        return False


def check_percentage(x):
    try:
        if x == "" or x is None:
            return True
        if x[-1] == "%":
            return True
    except Exception:
        return False


def get_mode(series: Series):
    try:
        return series.mode()[0]
    except KeyError:
        return None
