import logging
import uuid
from typing import List, Optional

from django.utils.text import slugify

import strawberry
import strawberry_django
from asgiref.sync import async_to_sync
from strawberry import auto
from strawberry.field_extensions import InputMutationExtension
from strawberry.types.info import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.permissions import IsAuthenticated

from hub import models
from hub.graphql.types import model_types

logger = logging.getLogger(__name__)


@strawberry.type
class MutationError:
    code: int
    message: str


@strawberry.type
class MutationOutput:
    code: int
    errors: list[MutationError]


@strawberry.input
class IDObject:
    id: str


@strawberry.input
class UpdateMappingItemInput:
    source: str
    source_path: str
    destination_column: str


@strawberry.input
class MapLayerInput:
    id: str
    name: str
    source: str
    visible: Optional[bool] = True


@strawberry_django.input(models.MapReport, partial=True)
class MapReportInput:
    id: auto
    organisation: auto
    name: auto
    slug: Optional[str]
    description: auto
    created_at: auto
    last_update: auto
    layers: Optional[List[MapLayerInput]]
    display_options: Optional[strawberry.scalars.JSON]


@strawberry.mutation(extensions=[IsAuthenticated(), InputMutationExtension()])
async def create_organisation(
    info: Info, name: str, slug: Optional[str] = None, description: Optional[str] = None
) -> models.Membership:
    org = await models.Organisation.objects.acreate(
        name=name, slug=slug, description=description
    )
    user = get_current_user(info)
    membership = await models.Membership.objects.acreate(
        user=user, organisation=org, role="owner"
    )
    return membership


@strawberry_django.input(models.Organisation, partial=True)
class OrganisationInputPartial:
    id: auto
    name: str
    slug: Optional[str]
    description: Optional[str]


@strawberry.mutation(extensions=[IsAuthenticated()])
def enable_auto_update(external_data_source_id: str) -> models.ExternalDataSource:
    data_source = models.ExternalDataSource.objects.get(id=external_data_source_id)
    data_source.enable_auto_update()
    return data_source


@strawberry.mutation(extensions=[IsAuthenticated()])
def disable_auto_update(external_data_source_id: str) -> models.ExternalDataSource:
    data_source = models.ExternalDataSource.objects.get(id=external_data_source_id)
    data_source.disable_auto_update()
    return data_source


@strawberry.type
class ExternalDataSourceAction:
    id: strawberry.scalars.ID
    external_data_source: model_types.ExternalDataSource


@strawberry.mutation(extensions=[IsAuthenticated()])
async def trigger_update(external_data_source_id: str) -> ExternalDataSourceAction:
    data_source = await models.ExternalDataSource.objects.aget(
        id=external_data_source_id
    )
    # Use this ID to track all jobs against it
    request_id = str(uuid.uuid4())
    await data_source.schedule_refresh_all(request_id=request_id)
    return ExternalDataSourceAction(id=request_id, external_data_source=data_source)


@strawberry.mutation(extensions=[IsAuthenticated()])
def refresh_webhooks(external_data_source_id: str) -> models.ExternalDataSource:
    data_source = models.ExternalDataSource.objects.get(id=external_data_source_id)
    data_source.refresh_webhooks()
    return data_source


def create_with_computed_args(model, info, data, computed_args):
    args = {
        **strawberry_django.mutations.resolvers.parse_input(info, vars(data).copy()),
        **computed_args(info, data, model),
    }
    return strawberry_django.mutations.resolvers.create(info, model, args)


def get_or_create_with_computed_args(model, info, find_filter, data, computed_args):
    """
    Returns tuple: (instance: Model, created: bool)
    """
    instance = model.objects.filter(**find_filter).first()
    if instance:
        return instance, False
    instance = create_with_computed_args(model, info, data, computed_args)
    return instance, True


@strawberry_django.mutation(extensions=[IsAuthenticated()], handle_django_errors=True)
def create_map_report(info: Info, data: MapReportInput) -> models.MapReport:
    existing_reports = model_types.Report.get_queryset(
        models.Report.objects.get_queryset(), info
    ).exists()
    map_report = create_with_computed_args(
        models.MapReport,
        info,
        data,
        computed_args=lambda info, data, model: {
            "organisation": get_or_create_organisation_for_source(info, data),
            "slug": data.slug or slugify(data.name),
        },
    )
    if existing_reports:
        return map_report
    # If this is the first report, add the user's first member list to it
    member_list = (
        model_types.ExternalDataSource.get_queryset(
            models.ExternalDataSource.objects.get_queryset(),
            info,
        )
        .filter(data_type=models.ExternalDataSource.DataSourceType.MEMBER)
        .first()
    )
    if member_list:
        map_report.name = f"Auto-generated report on {member_list.name}"
        map_report.layers = [
            {
                "id": str(uuid.uuid4()),
                "name": member_list.name,
                "source": str(member_list.id),
                "visible": True,
            }
        ]
        map_report.save()
    return map_report


def get_or_create_organisation_for_source(info: Info, data: any):
    if data.organisation:
        return data.organisation
    user = get_current_user(info)
    if (
        isinstance(data.organisation, strawberry.unset.UnsetType)
        or data.organisation is None
    ):
        membership = user.memberships.first()
        if membership is not None:
            print("Assigning the user's default organisation")
            organisation = membership.organisation
        else:
            print("Making an organisation for this user")
            organisation = models.Organisation.objects.create(
                name=f"{user.username}'s organisation", slug=f"{user.username}-org"
            )
            models.Membership.objects.create(
                user=user, organisation=organisation, role="owner"
            )
    return organisation


@strawberry_django.mutation(extensions=[IsAuthenticated()])
async def import_all(external_data_source_id: str) -> ExternalDataSourceAction:
    data_source = await models.ExternalDataSource.objects.aget(
        id=external_data_source_id
    )
    request_id = str(uuid.uuid4())
    await data_source.schedule_import_all(request_id=request_id)
    return ExternalDataSourceAction(id=request_id, external_data_source=data_source)


@strawberry_django.input(models.ExternalDataSource, partial=True)
class ExternalDataSourceInput:
    id: auto
    name: auto
    data_type: auto
    description: auto
    organisation: auto
    geography_column: auto
    geography_column_type: auto
    postcode_field: auto
    first_name_field: auto
    last_name_field: auto
    full_name_field: auto
    email_field: auto
    phone_field: auto
    address_field: auto
    auto_update_enabled: auto
    update_mapping: Optional[List[UpdateMappingItemInput]]
    auto_import_enabled: auto


@strawberry_django.input(models.AirtableSource, partial=True)
class AirtableSourceInput(ExternalDataSourceInput):
    api_key: auto
    base_id: auto
    table_id: auto


@strawberry_django.input(models.MailchimpSource, partial=True)
class MailChimpSourceInput(ExternalDataSourceInput):
    api_key: auto
    list_id: auto


@strawberry.input()
class CreateExternalDataSourceInput:
    mailchimp: Optional[MailChimpSourceInput] = None
    airtable: Optional[AirtableSourceInput] = None


@strawberry.type
class CreateExternalDataSourceOutput(MutationOutput):
    result: Optional[model_types.ExternalDataSource]


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def create_airtable_source(
    info: Info, data: CreateExternalDataSourceInput
) -> CreateExternalDataSourceOutput:
    return get_or_create_with_computed_args(
        models.AirtableSource,
        info,
        find_filter={
            "api_key": data.airtable.api_key,
            "base_id": data.airtable.base_id,
            "table_id": data.airtable.table_id,
        },
        data=data.airtable,
        computed_args=lambda info, data, model: {
            "organisation": get_or_create_organisation_for_source(info, data)
        },
    )


def create_mailchimp_source(
    info: Info, data: CreateExternalDataSourceInput
) -> models.ExternalDataSource:
    return get_or_create_with_computed_args(
        models.MailchimpSource,
        info,
        find_filter={
            "api_key": data.mailchimp.api_key,
            "list_id": data.mailchimp.list_id,
        },
        data=data.mailchimp,
        computed_args=lambda info, data, model: {
            "organisation": get_or_create_organisation_for_source(info, data)
        },
    )


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def create_external_data_source(
    info: Info, input: CreateExternalDataSourceInput
) -> models.ExternalDataSource:
    source_creators = {
        "airtable": create_airtable_source,
        "mailchimp": create_mailchimp_source,
    }

    creator_fn = None
    for key, fn in source_creators.items():
        source_input = getattr(input, key, None)
        if source_input is not None:
            creator_fn = fn

    if creator_fn is None:
        return CreateExternalDataSourceOutput(
            code=400,
            errors=["You must provide input data for a specific source type"],
            result=None,
        )

    try:
        result: tuple[models.ExternalDataSource, bool] = creator_fn(info, input)
        (source, created) = result

        if created:
            request_id = str(uuid.uuid4())
            async_to_sync(source.schedule_import_all)(request_id)
            return CreateExternalDataSourceOutput(code=200, errors=[], result=source)

        user = get_current_user(info)
        if user.memberships.filter(id=source.organisation.id).exists():
            return CreateExternalDataSourceOutput(code=409, errors=[], result=source)

        return CreateExternalDataSourceOutput(
            code=409,
            errors=[
                MutationError(
                    code=409,
                    message=(
                        "This source already exists in Mapped through another "
                        "organisation. Please contact us for assistance."
                    ),
                )
            ],
            result=None,
        )
    except Exception as e:
        logger.error(f"create_external_data_source error: {e}")
        return CreateExternalDataSourceOutput(code=500, errors=[], result=None)


@strawberry_django.input(models.SharingPermission, partial=True)
class SharingPermissionCUDInput:
    id: auto
    external_data_source_id: auto
    organisation_id: auto
    visibility_record_coordinates: auto
    visibility_record_details: auto


@strawberry.input
class SharingPermissionInput:
    id: Optional[strawberry.scalars.ID] = None
    external_data_source_id: strawberry.scalars.ID
    organisation_id: strawberry.scalars.ID
    visibility_record_coordinates: Optional[bool] = False
    visibility_record_details: Optional[bool] = False
    deleted: Optional[bool] = False


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def update_sharing_permissions(
    info: Info, from_org_id: str, permissions: List[SharingPermissionInput]
) -> List[models.ExternalDataSource]:
    user = get_current_user(info)
    for permission in permissions:
        source = models.ExternalDataSource.objects.get(
            id=permission.external_data_source_id
        )
        if not str(source.organisation_id) == from_org_id:
            raise PermissionError(
                "This data source does not belong to the organisation you specified."
            )
        if not source.organisation.members.filter(user=user).exists():
            raise PermissionError(
                "You do not have permission to change sharing preferences for this data source."
            )
        if permission.deleted:
            models.SharingPermission.objects.filter(id=permission.id).delete()
        else:
            models.SharingPermission.objects.update_or_create(
                # id=permission.id,
                external_data_source_id=permission.external_data_source_id,
                organisation_id=permission.organisation_id,
                defaults={
                    "visibility_record_coordinates": permission.visibility_record_coordinates,
                    "visibility_record_details": permission.visibility_record_details,
                },
            )
    # Return data sources for the current org
    result = list(
        models.ExternalDataSource.objects.filter(organisation_id=from_org_id).all()
    )
    return result
