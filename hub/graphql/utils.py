import strawberry_django
from strawberry.types.info import Info


def attr_resolver(root, info: Info):
    return getattr(root, info.python_name, None)


def attr_field(**kwargs):
    return strawberry_django.field(resolver=attr_resolver, **kwargs)


def fn_resolver(root, info: Info):
    return getattr(root, info.python_name, lambda: None)()


def fn_field(**kwargs):
    return strawberry_django.field(resolver=fn_resolver, **kwargs)


def dict_resolver(default=None):
    def _resolver(root, info: Info):
        return root.get(info.python_name, default)
    return _resolver


def dict_key_field(default=None, **kwargs):
    return strawberry_django.field(resolver=dict_resolver(default), **kwargs)
