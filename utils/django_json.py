import math

from django.core.serializers.json import DjangoJSONEncoder

import numpy as np


def nan2None(obj):
    if isinstance(obj, dict):
        return {k: nan2None(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [nan2None(v) for v in obj]
    elif isinstance(obj, float) and math.isnan(obj):
        return None
    return obj


class DBJSONEncoder(DjangoJSONEncoder):
    def encode(self, obj, *args, **kwargs):
        return super().encode(nan2None(obj), *args, **kwargs)


class PandasMappingSafeForPG(dict):
    @staticmethod
    def is_nan(v):
        try:
            if isinstance(v, dict):
                return False
            return np.isnan(v)
        except TypeError:
            return False

    def __new__(self, a):
        return {k: None if self.is_nan(v) else v for k, v in a}
