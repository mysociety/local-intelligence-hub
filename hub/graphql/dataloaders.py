from typing import Callable, Coroutine, Type
from django.db.models import Model as DjangoModel
from strawberry.types import Info
from strawberry_django.fields.field import StrawberryDjangoField
from strawberry_django_dataloaders import dataloaders, factories
from asgiref.sync import sync_to_async
from hub import models

class BasicFieldDataLoader(dataloaders.BaseDjangoModelDataLoader):
    field: str

    @classmethod
    def queryset(cls, keys: list[str]):
        keys = list(set(keys))
        if (len(keys) == 0):
            return []
        return cls.model.objects.filter(**{ f"{cls.field}__in": keys }).all()

    @classmethod
    @sync_to_async
    def load_fn(cls, keys: list[str]):
        # models.Area.objects.get
        results = cls.queryset(keys)
        return [
            next(
                (result for result in results if getattr(result, cls.field) == key),
                None,
            )
            for key in keys
        ]
    

class BasicFieldReturningListDataLoader(BasicFieldDataLoader):
    """
    As above, but returns a list of results for each key instead of a single item.
    """
    @classmethod
    @sync_to_async
    def load_fn(cls, keys: list[str]):
        results = cls.queryset(keys)
        return [
            [result for result in results if getattr(result, cls.field) == key]
            for key in keys
        ]
    

class FieldDataLoaderFactory(factories.BaseDjangoModelDataLoaderFactory):
    field: str

    loader_class = BasicFieldDataLoader

    @classmethod
    def get_loader_key(cls, model: Type["DjangoModel"], field: str, **kwargs):
        return model, field

    @classmethod
    def get_loader_class_kwargs(cls, model: Type["DjangoModel"], field: str, **kwargs):
        return {
            "model": model,
            "field": field,
        }

    @classmethod
    def as_resolver(cls, field: str) -> Callable[["DjangoModel", Info], Coroutine]:
        async def resolver(root: "DjangoModel", info: "Info"):  # beware, first argument needs to be called 'root'
            field_data: "StrawberryDjangoField" = info._field
            return await cls.get_loader_class(field_data.django_model, field)(context=info.context).load(getattr(root, field))

        return resolver
    
class FieldReturningListDataLoaderFactory(FieldDataLoaderFactory):
    loader_class = BasicFieldReturningListDataLoader