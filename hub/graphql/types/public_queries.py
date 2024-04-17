from typing import List, Optional

from django.conf import settings
from django.db.models import Q

import strawberry
from strawberry.dataloader import DataLoader
from strawberry.types.info import Info
from strawberry_django.auth.utils import get_current_user

from hub import models
from hub.graphql.types import model_types
from hub.graphql.types.postcodes import PostcodesIOResult
from utils.postcodesIO import get_bulk_postcode_geo


@strawberry.type
class PostcodeQueryResponse:
    postcode: str
    loaders: strawberry.Private[models.Loaders]

    @strawberry.field
    async def postcodesIO(self) -> Optional[PostcodesIOResult]:
        return await self.loaders["postcodesIO"].load(self.postcode)

    @strawberry.field
    async def constituency(self) -> Optional[model_types.Area]:
        postcode_data = await self.loaders["postcodesIO"].load(self.postcode)
        id = postcode_data.codes.parliamentary_constituency
        return await models.Area.objects.aget(Q(gss=id) | Q(name=id))

    @strawberry.field
    async def custom_source_data(
        self, source: str, source_path: str, info: Info
    ) -> Optional[str]:
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
    return PostcodeQueryResponse(postcode=postcode, loaders=loaders)


async def enrich_postcodes(postcodes: List[str], info: Info) -> PostcodeQueryResponse:
    if len(postcodes) > settings.POSTCODES_IO_BATCH_MAXIMUM:
        raise ValueError(
            f"Batch query takes a maximum of 100 postcodes. You provided {len(postcodes)}"
        )
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
