import itertools
from datetime import datetime
from enum import Enum
from typing import List, Optional, Union

from django.db.models import Q

import procrastinate.contrib.django.models
import strawberry
import strawberry_django
import strawberry_django_dataloaders.factories
import strawberry_django_dataloaders.fields
from strawberry import auto
from strawberry.scalars import JSON
from strawberry.types.info import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.permissions import IsAuthenticated

from hub import models
from hub.graphql.dataloaders import (
    FieldDataLoaderFactory,
    FieldReturningListDataLoaderFactory,
    ReverseFKWithFiltersDataLoaderFactory,
    filterable_dataloader_resolver,
)
from hub.graphql.types.geojson import MultiPolygonFeature, PointFeature
from hub.graphql.types.postcodes import PostcodesIOResult
from hub.graphql.utils import attr_field, dict_key_field, fn_field
from hub.graphql.types import model_types
from hub.management.commands.import_mps import party_shades
from utils.postcodesIO import get_postcode_geo

@strawberry.type
class CustomSourceData:
    '''
    A field for your third party data sources. e.g:

    ```graphql
    query {
      enrichPostcode(postcode: "SW1A 1AA") {
          postcode
          result {
              customSource(id: "Some Airtable") {
                  name: field(id: "Name")
                  address: field(id: "Address")
              }
          }
      }
    }
    ```
    '''

    @strawberry.field
    def field(self, id: str, info: Info) -> str:
        '''
        Each column can be accessed by this resolver.
        '''
        # TODO: return the field for that source
        return id

@strawberry.interface
class LocationQueryData:

    @strawberry.field
    def custom_source(id: str) -> CustomSourceData:
        return CustomSourceData(id=id)

@strawberry.interface
class LocationQueryResponse:
    result: LocationQueryData
    error: Optional[str] = None

@strawberry.type
class ConstituencyQueryData(model_types.Area, LocationQueryData):
    pass

@strawberry.type
class PostcodeQueryData(LocationQueryData):
    postcodesIO: PostcodesIOResult

    @strawberry.field
    async def constituency(self, info: Info) -> model_types.Area:
        id = self.postcodesIO.codes.parliamentary_constituency
        return await models.Area.objects.aget(Q(gss=id) | Q(name=id))

@strawberry.type
class PostcodeQueryResponse(LocationQueryResponse):
    postcode: str
    result: PostcodeQueryData

@strawberry.type
class ConstituencyQueryResponse(LocationQueryResponse):
    constituency: str
    result: ConstituencyQueryData

@strawberry_django.field()
async def enrich_postcode(postcode: str) -> PostcodeQueryResponse:
    postcode_data = await get_postcode_geo(postcode)
    return PostcodeQueryResponse(
        postcode=postcode,
        result=PostcodeQueryData(
            postcodesIO=postcode_data
        )
    )

@strawberry_django.field()
async def enrich_constituency(constituency: str) -> ConstituencyQueryResponse:
    return ConstituencyQueryResponse(
        constituency=constituency,
        result=models.Area.objects.filter(Q(gss=constituency) | Q(name=constituency)).first()
    )