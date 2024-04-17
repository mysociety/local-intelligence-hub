import itertools
from datetime import datetime
from enum import Enum
from typing import List, Optional, Union, Any

from django.db.models import Q
from django.conf import settings

import procrastinate.contrib.django.models
import strawberry
import strawberry_django
import strawberry_django_dataloaders.factories
import strawberry_django_dataloaders.fields
from strawberry.dataloader import DataLoader
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
from utils.postcodesIO import get_postcode_geo, get_bulk_postcode_geo

# @strawberry.type
# class CustomDataResolver:
#     '''
#     A field for your third party data sources. e.g:

#     ```graphql
#     query {
#       enrichPostcode(postcode: "SW1A 1AA") {
#           postcode
#           result {
#               customData(id: "Some Airtable") {
#                   name: field(source: "Some Airtable", sourcePath: "MP name")
#                   address: field(source: "Some Airtable", sourcePath: "MP email")
#                   address: field(source: "Google Sheet", sourcePath: "voting record")
#               }
#           }
#       }
#     }
#     ```
#     '''
#     loaders: strawberry.Private[models.Loaders]
#     postcode_data: strawberry.Private[PostcodesIOResult]

#     @strawberry.field
#     async def field(self, source: str, source_path: str, info: Info) -> str:
#         # return self.loaders()
#         source_loader = self.loaders["source_loaders"].get(source, None)
#         if source_loader is not None and postcode_data is not None:
#             loaded = await source_loader.load(
#                 self.EnrichmentLookup(
#                     member_id=self.get_record_id(member),
#                     postcode_data=postcode_data,
#                     source_id=source,
#                     source_path=source_path,
#                 )
#             )

# @strawberry.interface
# class LocationQueryData:
#     postcode: Optional[strawberry.Private[str]]
#     constituency: Optional[strawberry.Private[str]]

#     @strawberry.field
#     async def custom_data(self, info: Info) -> CustomDataResolver:
#         user = get_current_user(info)
#         loaders = models.Loaders(
#             postcodesIO=DataLoader(load_fn=get_bulk_postcode_geo),
#             source_loaders={
#                 str(source.id): source.data_loader_factory()
#                 async for source in models.ExternalDataSource.objects.filter(
#                     organisation__members__user=user,
#                     geography_column__isnull=False,
#                     geography_column_type__isnull=False,
#                 ).all()
#             },
#         )
#         return CustomDataResolver(
#             id=id,
#             loaders=loaders
#         )

# @strawberry.interface
# class LocationQueryResponse:
#     error: Optional[str] = None

# @strawberry.type
# class ConstituencyQueryData(model_types.Area, LocationQueryData):
#     pass

@strawberry.type
class PostcodeQueryResponse:
    postcode: str
    loaders: strawberry.Private[models.Loaders]
    
    @strawberry.field
    async def postcodesIO(self) -> Optional[PostcodesIOResult]:
        return await self.loaders["postcodesIO"].load(self.postcode)

    @strawberry.field
    async def constituency(self, info: Info) -> Optional[model_types.Area]:
        postcode_data = await self.loaders["postcodesIO"].load(self.postcode)
        id = postcode_data.codes.parliamentary_constituency
        return await models.Area.objects.aget(Q(gss=id) | Q(name=id))

    @strawberry.field
    async def custom_source_data(self, source: str, source_path: str, info: Info) -> Optional[str]:
        # return self.loaders()
        source_loader = self.loaders["source_loaders"].get(source, None)
        postcode_data = await self.loaders["postcodesIO"].load(self.postcode)
        if source_loader is not None and postcode_data is not None:
            loaded = await source_loader.load(
                models.EnrichmentLookup(
                    member_id=self.postcode,
                    postcode_data=postcode_data,
                    source_id=source,
                    source_path=source_path,
                )
            )
        return loaded

# @strawberry.type
# class ConstituencyQueryResponse:
#     constituency: str
#     result: ConstituencyQueryData

async def enrich_postcode(postcode: str, info: Info) -> PostcodeQueryResponse:
    user = get_current_user(info)
    loaders = models.Loaders(
        postcodesIO=DataLoader(load_fn=get_bulk_postcode_geo),
        source_loaders={
            str(source.id): source.data_loader_factory()
            async for source in models.ExternalDataSource.objects.filter(
                organisation__members__user=user,
                geography_column__isnull=False,
                geography_column_type__isnull=False,
            ).all()
        },
    )
    return PostcodeQueryResponse(
        postcode=postcode,
        loaders=loaders
    )

async def enrich_postcodes(postcodes: List[str], info: Info) -> PostcodeQueryResponse:
    if len(postcodes) > settings.POSTCODES_IO_BATCH_MAXIMUM:
        raise ValueError(f"Batch query takes a maximum of 100 postcodes. You provided {len(postcodes)}")
    user = get_current_user(info)
    loaders = models.Loaders(
        postcodesIO=DataLoader(load_fn=get_bulk_postcode_geo),
        source_loaders={
            str(source.id): source.data_loader_factory()
            async for source in models.ExternalDataSource.objects.filter(
                organisation__members__user=user,
                geography_column__isnull=False,
                geography_column_type__isnull=False,
            ).all()
        },
    )
    return [
        PostcodeQueryResponse(postcode=postcode, loaders=loaders)
        for postcode in postcodes
    ]

# @strawberry_django.field()
# async def enrich_constituency(constituency: str) -> ConstituencyQueryResponse:
#     return ConstituencyQueryResponse(
#         constituency=constituency,
#         result=models.Area.objects.filter(Q(gss=constituency) | Q(name=constituency)).first()
#     )