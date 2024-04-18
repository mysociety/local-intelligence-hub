import datetime
import json
from typing import List, Optional, cast

from django.conf import settings
from django.db.models import Q

import jwt
import pytz
import strawberry
import strawberry_django
from gqlauth.core.utils import app_settings
from gqlauth.jwt.types_ import TokenPayloadType, TokenType
from strawberry.dataloader import DataLoader
from strawberry.types.info import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.permissions import IsAuthenticated

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
        if postcode_data is None:
            return None
        id = postcode_data.codes.parliamentary_constituency
        return await models.Area.objects.aget(Q(gss=id) | Q(name=id))

    @strawberry.field
    async def custom_source_data(
        self, source: str, source_path: str, info: Info
    ) -> Optional[str]:
        source_loader = self.loaders["source_loaders"].get(source, None)
        postcode_data = await self.loaders["postcodesIO"].load(self.postcode)
        if source_loader is not None and postcode_data is not None:
            return await source_loader.load(
                models.EnrichmentLookup(
                    member_id=self.postcode,
                    postcode_data=postcode_data,
                    source_id=source,
                    source_path=source_path,
                )
            )


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


########################
# API token management
########################


@strawberry_django.type(models.APIToken)
class APIToken:
    token: str
    expires_at: datetime.datetime
    signature: str
    created_at: datetime.datetime
    revoked: bool


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def create_api_token(info: Info, expiry_days: int = 3650) -> APIToken:
    user = get_current_user(info)
    user_pk = app_settings.JWT_PAYLOAD_PK.python_name
    pk_field = {user_pk: getattr(user, user_pk)}
    expires_at = datetime.datetime.now(tz=pytz.utc) + datetime.timedelta(
        days=expiry_days
    )
    payload = TokenPayloadType(**pk_field, exp=expires_at)
    serialized = json.dumps(payload.as_dict(), sort_keys=True, indent=1)
    token = TokenType(
        token=str(
            jwt.encode(
                payload={"payload": serialized},
                key=cast(str, app_settings.JWT_SECRET_KEY.value),
                algorithm=app_settings.JWT_ALGORITHM,
            )
        ),
        payload=payload,
    )

    models.APIToken.objects.create(
        signature=token.token.split(".")[2],
        token=token.token,
        user=user,
        expires_at=expires_at,
    )

    return token


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def revoke_api_token(signature: str, info: Info) -> APIToken:
    token = models.APIToken.objects.get(signature=signature)
    token.revoked = True
    token.save()
    return token


@strawberry_django.field(extensions=[IsAuthenticated()])
def list_api_tokens(info: Info) -> List[APIToken]:
    tokens = models.APIToken.objects.filter(user=get_current_user(info))
    return tokens


def decode_jwt(token: str) -> "TokenType":
    from gqlauth.core.utils import app_settings
    from gqlauth.jwt.types_ import TokenPayloadType, TokenType

    decoded = json.loads(
        jwt.decode(
            token,
            key=cast(str, app_settings.JWT_SECRET_KEY.value),
            algorithms=[
                app_settings.JWT_ALGORITHM,
            ],
        )["payload"]
    )

    signature = token.split(".")[2]
    db_token = models.APIToken.objects.filter(signature=signature).first()
    if db_token is None:
        # Only API tokens can be revoked, so continue
        pass
    elif db_token.revoked:
        raise ValueError("Token has been revoked")

    return TokenType(token=token, payload=TokenPayloadType.from_dict(decoded))
