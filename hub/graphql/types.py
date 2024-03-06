import strawberry
import strawberry_django
from strawberry_django.auth.utils import get_current_user
from strawberry import auto
from typing import List
from hub import models

@strawberry_django.type(models.Area)
class Area:
    id: auto
    mapit_id: auto
    gss: auto
    name: auto
    area_type: 'AreaType'
    geometry: auto
    overlaps: List['Area']

@strawberry_django.type(models.AreaType)
class AreaType:
    id: auto
    name: auto
    area_type: auto
    description: auto

    @strawberry_django.field
    def areas(self) -> List[Area]:
        return self.area_set.all()
    
@strawberry_django.type(models.User)
class User:
    email: auto
    user_properties: 'UserProperties'

@strawberry_django.type(models.UserProperties)
class UserProperties:
    user: User
    full_name: auto

@strawberry_django.input(models.Membership)
class Membership:
    user: User
    organisation: 'Organisation'
    role: auto

@strawberry_django.input(models.Organisation)
class Organisation:
    name: auto
    slug: auto
    members: List[Membership]
    data_sources: List['ExternalDataSource']

# Membership
@strawberry_django.type(models.Membership)
class Membership:
    id: auto
    user: User
    organisation: 'Organisation'

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        user = get_current_user(info)
        return queryset.filter(pk__in=user.memberships.values_list('id', flat=True))

# Organisation
@strawberry_django.type(models.Organisation)
class Organisation:
    id: auto
    name: auto
    slug: auto
    members: List[Membership]

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        user = get_current_user(info)
        return queryset.filter(pk__in=user.memberships.values_list('organisation_id', flat=True))

# ExternalDataSource
@strawberry_django.type(models.ExternalDataSource)
class ExternalDataSource:
    id: auto
    name: auto
    description: auto
    update_config: List['ExternalDataSourceUpdateConfig']

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        user = get_current_user(info)
        return queryset.filter(
            # Only list data sources that the user has access to
            update_config__organisation__in=user.memberships.values_list('organisation_id', flat=True)
        )

    @strawberry_django.field
    def healthcheck(self, info) -> bool:
        return self.healthcheck()

    # TODO: get polymorphic specific / type

@strawberry_django.type(models.AirtableSource)
class AirtableSource(ExternalDataSource):
    api_key: auto
    base_id: auto
    table_id: auto

  
@strawberry.type
class UpdateConfigDict:
    source: str
    source_path: str
    destination_column: str

@strawberry_django.type(models.ExternalDataSourceUpdateConfig)
class ExternalDataSourceUpdateConfig:
    id: auto
    data_source: 'ExternalDataSource'
    mapping: List[UpdateConfigDict]
    postcode_column: auto
    enabled: auto

    @strawberry_django.field
    def webhook_url(self, info) -> str:
        return self.data_source.webhook_url(config=self)
    
    @strawberry_django.field
    def webhook_healthcheck(self, info) -> bool:
        return self.data_source.webhook_healthcheck(config=self)

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        user = get_current_user(info)
        return queryset.filter(
            # Only list data sources that the user has access to
            data_source__organisation__in=user.memberships.values_list('organisation_id', flat=True)
        )