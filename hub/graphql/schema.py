import logging
from typing import List, Optional

from django.core.exceptions import ObjectDoesNotExist, PermissionDenied

import strawberry
import strawberry_django
from gqlauth.core.middlewares import JwtSchema
from gqlauth.user import arg_mutations as auth_mutations
from gqlauth.user.queries import UserQueries
from graphql import GraphQLError
from strawberry.types import ExecutionContext
from strawberry_django import mutations as django_mutations
from strawberry_django.optimizer import DjangoOptimizerExtension
from strawberry_django.permissions import IsAuthenticated

from hub import models
from hub.graphql import mutations as mutation_types
from hub.graphql.types import model_types

logger = logging.getLogger(__name__)


@strawberry.type
class Query(UserQueries):
    memberships: List[model_types.Membership] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    all_organisations: List[model_types.PublicOrganisation] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    my_organisations: List[model_types.Organisation] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )

    external_data_source: model_types.ExternalDataSource = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    shared_data_source: model_types.SharedDataSource = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    external_data_sources: List[
        model_types.ExternalDataSource
    ] = strawberry_django.field(extensions=[IsAuthenticated()])
    imported_data_geojson_point: Optional[
        model_types.MapReportMemberFeature
    ] = model_types.imported_data_geojson_point
    shared_data_sources: List[model_types.SharedDataSource] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    airtable_source: model_types.AirtableSource = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    airtable_sources: List[model_types.AirtableSource] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    job: model_types.QueueJob = strawberry_django.field(extensions=[IsAuthenticated()])
    jobs: List[model_types.QueueJob] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    reports: List[model_types.Report] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    map_report: model_types.MapReport = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    map_reports: List[model_types.MapReport] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    area: Optional[model_types.Area] = model_types.area_by_gss
    dataSet: Optional[model_types.DataSet] = model_types.dataset_by_name

    @strawberry.field
    def test_airtable_source(
        self,
        info: strawberry.types.info.Info,
        api_key: str,
        base_id: str,
        table_id: str,
    ) -> model_types.AirtableSource:
        return models.AirtableSource(
            api_key=api_key, base_id=base_id, table_id=table_id
        )


@strawberry.type
class Mutation:
    token_auth = auth_mutations.ObtainJSONWebToken.field
    register = auth_mutations.Register.field
    verify_account = auth_mutations.VerifyAccount.field
    resend_activation_email = auth_mutations.ResendActivationEmail.field

    create_airtable_source: mutation_types.CreateSourceMutationOutput = (
        mutation_types.create_airtable_source
    )
    update_airtable_source: model_types.AirtableSource = django_mutations.update(
        mutation_types.AirtableSourceInput, extensions=[IsAuthenticated()]
    )
    update_external_data_source: model_types.ExternalDataSource = (
        django_mutations.update(
            mutation_types.ExternalDataSourceInput, extensions=[IsAuthenticated()]
        )
    )
    delete_airtable_source: model_types.AirtableSource = django_mutations.delete(
        mutation_types.IDObject, extensions=[IsAuthenticated()]
    )
    delete_external_data_source: model_types.ExternalDataSource = (
        django_mutations.delete(mutation_types.IDObject, extensions=[IsAuthenticated()])
    )

    enable_auto_update: model_types.ExternalDataSource = (
        mutation_types.enable_auto_update
    )
    disable_auto_update: model_types.ExternalDataSource = (
        mutation_types.disable_auto_update
    )
    trigger_update: mutation_types.ExternalDataSourceAction = (
        mutation_types.trigger_update
    )
    refresh_webhooks: model_types.ExternalDataSource = mutation_types.refresh_webhooks

    create_organisation: model_types.Membership = mutation_types.create_organisation
    update_organisation: model_types.Organisation = django_mutations.update(
        mutation_types.OrganisationInputPartial, extensions=[IsAuthenticated()]
    )

    import_all: mutation_types.ExternalDataSourceAction = mutation_types.import_all

    create_map_report: model_types.MapReport = mutation_types.create_map_report
    update_map_report: model_types.MapReport = django_mutations.update(
        mutation_types.MapReportInput, extensions=[IsAuthenticated()]
    )
    delete_map_report: model_types.MapReport = django_mutations.delete(
        mutation_types.IDObject, extensions=[IsAuthenticated()]
    )

    create_sharing_permission: model_types.SharingPermission = django_mutations.create(
        mutation_types.SharingPermissionCUDInput, extensions=[IsAuthenticated()]
    )
    delete_sharing_permission: model_types.SharingPermission = django_mutations.delete(
        mutation_types.IDObject, extensions=[IsAuthenticated()]
    )
    # TODO: install django-guardian to handle permissions
    update_sharing_permission: model_types.SharingPermission = django_mutations.update(
        mutation_types.SharingPermissionCUDInput, extensions=[IsAuthenticated()]
    )
    update_sharing_permissions: List[
        model_types.ExternalDataSource
    ] = mutation_types.update_sharing_permissions


class CustomErrorLoggingSchema(JwtSchema):
    errors_to_ignore: List[type[Exception]] = [
        PermissionDenied,
        ObjectDoesNotExist,
    ]
    """
    Squash ignorable GraphQL exceptions for cleaner logs
    (currently just Permissions and Not Found errors)
    """

    def process_errors(
        self,
        errors: List[GraphQLError],
        execution_context: ExecutionContext | None = None,
    ) -> None:
        notable_errors = []
        for error in errors:
            matching_ignored_error_class = next(
                (
                    cls
                    for cls in self.errors_to_ignore
                    if isinstance(error.original_error, cls)
                ),
                None,
            )
            if matching_ignored_error_class is not None:
                # Log a warning for an ignored error class
                logger.warning(
                    f"GraphQL request raised {matching_ignored_error_class.__name__} exception."
                )
            else:
                # Otherwise pass the error to the default logger
                # (which prints the full stack trace)
                notable_errors.append(error)
        return super().process_errors(notable_errors, execution_context)


schema = CustomErrorLoggingSchema(
    query=Query,
    mutation=Mutation,
    extensions=[
        DjangoOptimizerExtension,  # not required, but highly recommended
    ],
)
