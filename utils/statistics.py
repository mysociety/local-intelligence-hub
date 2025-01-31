from pandas import DataFrame
import locale

def attempt_interpret_series_as_float(df: DataFrame):
    if all(df.apply(check_numeric)):
        # Whole value replacement
        df = df.replace("", 0)
        # Substring replacement
        df = df.str.replace("%", "")
        df = df.astype(float)
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