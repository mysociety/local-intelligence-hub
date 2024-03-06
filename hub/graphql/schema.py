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

from hub.graphql import types
from hub.graphql import mutations as mutation_types
from hub import models

@strawberry.type
class Query(UserQueries):
    # Create automatic resolvers for 'areas' and 'area_types'
    areas: list[types.Area] = strawberry_django.field()
    area_types: list[types.AreaType] = strawberry_django.field()
    memberships: list[types.Membership] = strawberry_django.field()
    organisations: list[types.Organisation] = strawberry_django.field()
    external_data_sources: list[types.ExternalDataSource] = strawberry_django.field()
    airtable_sources: list[types.AirtableSource] = strawberry_django.field()
    external_data_source_update_configs: list[types.ExternalDataSourceUpdateConfig] = strawberry_django.field()

    @strawberry_django.field
    def public_areas(self) -> list[types.Area]:
        return models.Area.objects.all()
    
    @strawberry_django.field
    def private_areas(self, info: Info) -> list[types.Area]:
        user = get_user(info)

        if not user.is_authenticated:
            raise GQLAuthError(code=GQLAuthErrors.UNAUTHENTICATED)
        areas = list(models.Area.objects.all())
        return areas
    
@strawberry.type
class Mutation:
    token_auth = auth_mutations.ObtainJSONWebToken.field

    create_airtable_source: types.AirtableSource = mutations.create(mutation_types.AirtableSourceInput)
    update_airtable_source: types.AirtableSource = mutations.update(mutation_types.AirtableSourceUpdateInput)
    delete_airtable_source: types.AirtableSource = mutations.delete(NodeInput)

    create_external_data_source_update_config: types.ExternalDataSourceUpdateConfig = mutations.create(mutation_types.ExternalDataSourceUpdateConfigInput)
    update_external_data_source_update_config: types.ExternalDataSourceUpdateConfig = mutations.update(mutation_types.ExternalDataSourceUpdateConfigUpdateInput)
    delete_external_data_source_update_config: types.ExternalDataSourceUpdateConfig = mutations.delete(NodeInput)

    # TODO: enable
    # TODO: disable
    # TODO: schedule manual update
    # TODO: refresh webhook

schema = JwtSchema(
    query=Query,
    mutation=Mutation,
    extensions=[
        DjangoOptimizerExtension,  # not required, but highly recommended
    ],
)
