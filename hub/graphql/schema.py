from gqlauth.core.middlewares import JwtSchema
from gqlauth.core.types_ import GQLAuthError, GQLAuthErrors
from gqlauth.core.utils import get_user
from gqlauth.user.queries import UserQueries
from gqlauth.user import arg_mutations as auth_mutations
from strawberry_django import mutations, NodeInput
import strawberry
from strawberry.types import Info
import strawberry_django
from strawberry_django.optimizer import DjangoOptimizerExtension
from strawberry_django.permissions import IsAuthenticated
from typing import List

from hub.graphql import types
from hub.graphql import mutations as mutation_types
from hub import models

@strawberry.type
class Query(UserQueries):
    # Create automatic resolvers for 'areas' and 'area_types'
    areas: List[types.Area] = strawberry_django.field()
    area_types: List[types.AreaType] = strawberry_django.field()
    memberships: List[types.Membership] = strawberry_django.field(extensions=[IsAuthenticated()])
    organisations: List[types.Organisation] = strawberry_django.field(extensions=[IsAuthenticated()])

    external_data_source: types.ExternalDataSource = strawberry_django.field(extensions=[IsAuthenticated()])
    external_data_sources: List[types.ExternalDataSource] = strawberry_django.field(extensions=[IsAuthenticated()])
    airtable_source: types.AirtableSource = strawberry_django.field(extensions=[IsAuthenticated()])
    airtable_sources: List[types.AirtableSource] = strawberry_django.field(extensions=[IsAuthenticated()])
    external_data_source_update_config: types.ExternalDataSourceUpdateConfig = strawberry_django.field(extensions=[IsAuthenticated()])
    external_data_source_update_configs: List[types.ExternalDataSourceUpdateConfig] = strawberry_django.field(extensions=[IsAuthenticated()])
    event: types.EventLogItem = strawberry_django.field(extensions=[IsAuthenticated()])
    events: List[types.EventLogItem] = strawberry_django.field(extensions=[IsAuthenticated()])
    
    @strawberry.field
    def test_airtable_source(self,
                                 info: Info, 
                                 api_key: str,
                                 base_id: str,
                                 table_id: str) -> bool:
        return models.AirtableSource(
            api_key=api_key,
            base_id=base_id,
            table_id=table_id
        ).healthcheck()

    @strawberry_django.field
    def public_areas(self) -> List[types.Area]:
        return models.Area.objects.all()
    
    @strawberry_django.field
    def private_areas(self, info: Info) -> List[types.Area]:
        user = get_user(info)

        if not user.is_authenticated:
            raise GQLAuthError(code=GQLAuthErrors.UNAUTHENTICATED)
        areas = list(models.Area.objects.all())
        return areas
    
@strawberry.type
class Mutation:
    token_auth = auth_mutations.ObtainJSONWebToken.field

    create_airtable_source: types.AirtableSource = mutations.create(mutation_types.AirtableSourceInput, extensions=[IsAuthenticated()])
    update_airtable_source: types.AirtableSource = mutations.update(mutation_types.AirtableSourceInputPartial, extensions=[IsAuthenticated()])
    delete_airtable_source: types.AirtableSource = mutations.delete(str, extensions=[IsAuthenticated()])
    delete_external_data_source: types.ExternalDataSource = mutations.delete(mutation_types.IDObject, extensions=[IsAuthenticated()])

    create_external_data_source_update_config: types.ExternalDataSourceUpdateConfig = mutations.create(mutation_types.ExternalDataSourceUpdateConfigInput, extensions=[IsAuthenticated()])
    update_external_data_source_update_config: types.ExternalDataSourceUpdateConfig = mutations.update(mutation_types.ExternalDataSourceUpdateConfigInputPartial, extensions=[IsAuthenticated()])
    delete_external_data_source_update_config: types.ExternalDataSourceUpdateConfig = mutations.delete(NodeInput, extensions=[IsAuthenticated()])

    enable_update_config: types.ExternalDataSourceUpdateConfig = mutation_types.enable_update_config
    disable_update_config: types.ExternalDataSourceUpdateConfig = mutation_types.disable_update_config
    update_all: types.EventLogItem = mutation_types.update_all
    refresh_webhook: types.ExternalDataSourceUpdateConfig = mutation_types.refresh_webhook

    create_organisation: types.Membership = mutation_types.create_organisation
    update_organisation: types.Organisation = mutations.update(mutation_types.OrganisationInputPartial, extensions=[IsAuthenticated()])

schema = JwtSchema(
    query=Query,
    mutation=Mutation,
    extensions=[
        DjangoOptimizerExtension,  # not required, but highly recommended
    ],
)
