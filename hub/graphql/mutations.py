import strawberry
import strawberry_django
from strawberry import auto
from hub import models
from . import types
from typing import List, Optional
from strawberry.field_extensions import InputMutationExtension
from strawberry_django.permissions import IsAuthenticated
from strawberry_django.auth.utils import get_current_user
from strawberry.types.info import Info
import procrastinate.contrib.django.models

@strawberry_django.input(models.ExternalDataSource)
class ExternalDataSourceInput:
    name: auto
    description: auto
    organisation: auto

@strawberry_django.input(models.AirtableSource)
class AirtableSourceInput(ExternalDataSourceInput):
    api_key: auto
    base_id: auto
    table_id: auto

@strawberry_django.partial(models.AirtableSource)
class AirtableSourceInputPartial(AirtableSourceInput):
    pass

@strawberry.input
class UpdateConfigDictInput:
    source: str
    source_path: str
    destination_column: str

@strawberry_django.input(models.ExternalDataSourceUpdateConfig)
class ExternalDataSourceUpdateConfigInput:
    external_data_source: types.ExternalDataSource
    postcode_column: auto
    enabled: auto
    mapping: List[UpdateConfigDictInput]
  
@strawberry_django.partial(models.ExternalDataSourceUpdateConfig)
class ExternalDataSourceUpdateConfigInputPartial(ExternalDataSourceUpdateConfigInput):
    pass

@strawberry.mutation(extensions=[IsAuthenticated(), InputMutationExtension()])
async def create_organisation(info: Info, name: str, slug: Optional[str] = None, description: Optional[str] = None) -> types.Membership:
    org = await models.Organisation.objects.acreate(name=name, slug=slug, description=description)
    user = get_current_user(info)
    membership = await models.Membership.objects.acreate(user=user, organisation=org, role="owner")
    return membership

@strawberry_django.input(models.Organisation, partial=True)
class OrganisationInputPartial:
    name: str
    slug: Optional[str]
    description: Optional[str]

@strawberry.mutation(extensions=[IsAuthenticated()])
def enable_update_config (config_id: str) -> models.ExternalDataSourceUpdateConfig:
    config = models.ExternalDataSourceUpdateConfig.objects.get(id=config_id)
    config.enable()
    return config

@strawberry.mutation(extensions=[IsAuthenticated()])
def disable_update_config (config_id: str) -> models.ExternalDataSourceUpdateConfig:
    config = models.ExternalDataSourceUpdateConfig.objects.get(id=config_id)
    config.disable()
    return config

@strawberry.mutation(extensions=[IsAuthenticated()])
def update_all(config_id: str) -> procrastinate.contrib.django.models.ProcrastinateJob:
    config = models.ExternalDataSourceUpdateConfig.objects.get(id=config_id)
    job_id = config.schedule_update_all()
    return procrastinate.contrib.django.models.ProcrastinateJob.objects.get(id=job_id)

@strawberry.mutation(extensions=[IsAuthenticated()])
def refresh_webhook (config_id: str) -> models.ExternalDataSourceUpdateConfig:
    config = models.ExternalDataSourceUpdateConfig.objects.get(id=config_id)
    if config.external_data_source.automated_webhooks:
        config.refresh_webhook()
    return config