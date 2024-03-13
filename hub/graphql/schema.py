from typing import List

import strawberry
import strawberry_django
from gqlauth.core.middlewares import JwtSchema
from gqlauth.user import arg_mutations as auth_mutations
from gqlauth.user.queries import UserQueries
from strawberry_django import mutations
from strawberry_django.optimizer import DjangoOptimizerExtension
from strawberry_django.permissions import IsAuthenticated

from hub import models
from hub.graphql import mutations as mutation_types
from hub.graphql import types


@strawberry.type
class Query(UserQueries):
    memberships: List[types.Membership] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    organisations: List[types.Organisation] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )

    external_data_source: types.ExternalDataSource = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    external_data_sources: List[types.ExternalDataSource] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    airtable_source: types.AirtableSource = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    airtable_sources: List[types.AirtableSource] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    job: types.QueueJob = strawberry_django.field(extensions=[IsAuthenticated()])
    jobs: List[types.QueueJob] = strawberry_django.field(extensions=[IsAuthenticated()])

    @strawberry.field
    def test_airtable_source(
        self,
        info: strawberry.types.info.Info,
        api_key: str,
        base_id: str,
        table_id: str,
    ) -> types.AirtableSource:
        return models.AirtableSource(
            api_key=api_key, base_id=base_id, table_id=table_id
        )


@strawberry.type
class Mutation:
    token_auth = auth_mutations.ObtainJSONWebToken.field
    register = auth_mutations.Register.field
    verify_account = auth_mutations.VerifyAccount.field
    resend_activation_email = auth_mutations.ResendActivationEmail.field

    create_airtable_source: types.AirtableSource = mutation_types.create_airtable_source
    update_airtable_source: types.AirtableSource = mutations.update(
        mutation_types.AirtableSourceInput, extensions=[IsAuthenticated()]
    )
    update_external_data_source: types.ExternalDataSource = mutations.update(
        mutation_types.ExternalDataSourceInput, extensions=[IsAuthenticated()]
    )
    delete_airtable_source: types.AirtableSource = mutations.delete(
        str, extensions=[IsAuthenticated()]
    )
    delete_external_data_source: types.ExternalDataSource = mutations.delete(
        mutation_types.IDObject, extensions=[IsAuthenticated()]
    )

    enable_auto_update: types.ExternalDataSource = mutation_types.enable_auto_update
    disable_auto_update: types.ExternalDataSource = mutation_types.disable_auto_update
    trigger_update: types.ExternalDataSource = mutation_types.trigger_update
    refresh_webhooks: types.ExternalDataSource = mutation_types.refresh_webhooks

    create_organisation: types.Membership = mutation_types.create_organisation
    update_organisation: types.Organisation = mutations.update(
        mutation_types.OrganisationInputPartial, extensions=[IsAuthenticated()]
    )

    import_all: types.ExternalDataSource = mutation_types.import_all


schema = JwtSchema(
    query=Query,
    mutation=Mutation,
    extensions=[
        DjangoOptimizerExtension,  # not required, but highly recommended
    ],
)
