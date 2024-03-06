import strawberry_django
from strawberry import auto
from strawberry import auto
from hub import models
from . import types
from typing import List

@strawberry_django.input(models.ExternalDataSource)
class ExternalDataSourceInput:
    name: auto
    description: auto

@strawberry_django.input(models.AirtableSource)
class AirtableSourceInput(ExternalDataSourceInput):
    api_key: auto
    base_id: auto
    table_id: auto

@strawberry_django.partial(models.AirtableSource)
class AirtableSourceUpdateInput(AirtableSourceInput):
    pass

@strawberry_django.input(models.ExternalDataSourceUpdateConfig)
class ExternalDataSourceUpdateConfigInput:
    data_source: types.ExternalDataSource
    mapping: List[types.UpdateConfigDict]
    postcode_column: auto
    enabled: auto
  
@strawberry_django.partial(models.ExternalDataSourceUpdateConfig)
class ExternalDataSourceUpdateConfigUpdateInput(ExternalDataSourceUpdateConfigInput):
    pass