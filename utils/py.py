import itertools
import pprint
from types import SimpleNamespace
from utils.log import get_simple_debug_logger
logger = get_simple_debug_logger(__name__)
from benedict import benedict


class DictWithDotNotation(SimpleNamespace):
    def __init__(self, dictionary, **kwargs):
        super().__init__(**kwargs)
        for key, value in dictionary.items():
            if isinstance(value, dict):
                self.__setattr__(key, DictWithDotNotation(value))
            else:
                self.__setattr__(key, value)


def get(d, path, default=None):
    if isinstance(d, benedict):
        val = d[path]
    else:
        try:
            o = benedict()
            for key in d:
                o[key] = d[key]
            val = o[path]
        except Exception as e:
            return default
    return val if val is not None else default


def is_sequence(arg):
    if isinstance(arg, str):
        return False
    return (
        not hasattr(arg, "strip")
        and hasattr(arg, "__getitem__")
        or hasattr(arg, "__iter__")
    )


def ensure_list(possible):
    if is_sequence(possible):
        return possible
    elif possible:
        return [possible]
    else:
        return []


def get_path(d, *keys):
    for k in keys:
        d = get(d, k)
    return d


def chunk_array(arr, max_size):
    for i in range(0, len(arr), max_size):
        yield arr[i : i + max_size]


def batched(iterable, n):
    "Batch data into tuples of length n. The last batch may be shorter."
    if n < 1:
        raise ValueError("n must be at least one")
    it = iter(iterable)
    while batch := tuple(itertools.islice(it, n)):
        yield batch


def batch_and_aggregate(arr_limit):
    def decorator(original_fn):
        async def resulting_fn(arr):
            batches = chunk_array(arr, arr_limit)
            results = []
            for batch in batches:
                results += await original_fn(batch)
            return results

        return resulting_fn

    return decorator


def trace(fn):
    def wrapped_fn(*args, **kwargs):
        try:
            res = fn(*args, **kwargs)
            logger.debug(fn.__name__, args, kwargs)
            logger.debug('->', res)

            return res
        except Exception as err:
            print(fn.__name__, args, kwargs)
            print("THROWS", err)

            raise err

    return wrapped_fn


pp = pprint.PrettyPrinter(indent=4)
pr = pp.pprint


def transform_dict_values_recursive(value, transform_value_fn = lambda v: v, delete_null_keys=False):
    if isinstance(value, dict):
        new_dict = {}
        for key, v in value.items():
            v_transformed = transform_dict_values_recursive(v, transform_value_fn, delete_null_keys)
            if delete_null_keys is False or (delete_null_keys is True and v_transformed is not None):
                logger.debug("setting", key, v_transformed, delete_null_keys, v_transformed is None)
                new_dict[key] = v_transformed
        return new_dict
    elif isinstance(value, list):
        return [transform_dict_values_recursive(v, transform_value_fn, delete_null_keys) for v in value]
    else:
        return transform_value_fn(value)
