from gqlauth.core.middlewares import JwtSchema
from gqlauth.core.types_ import GQLAuthError, GQLAuthErrors
from gqlauth.core.utils import get_user
from gqlauth.user.queries import UserQueries
from gqlauth.user import arg_mutations as mutations
import strawberry
from strawberry.types import Info
import strawberry_django
from strawberry_django.optimizer import DjangoOptimizerExtension

from hub.graphql.types import Area, AreaType
from hub import models

@strawberry.type
class Query(UserQueries):
    # Create automatic resolvers for 'areas' and 'area_types'
    areas: list[Area] = strawberry_django.field()
    area_types: list[AreaType] = strawberry_django.field()

    @strawberry_django.field
    def public_areas(self) -> list[Area]:
        return models.Area.objects.all()
    
    @strawberry_django.field
    def private_areas(self, info: Info) -> list[Area]:
        user = get_user(info)

        if not user.is_authenticated:
            raise GQLAuthError(code=GQLAuthErrors.UNAUTHENTICATED)
        areas = list(models.Area.objects.all())
        return areas


@strawberry.type
class Mutation:
    token_auth = mutations.ObtainJSONWebToken.field

schema = JwtSchema(
    query=Query,
    mutation=Mutation,
    extensions=[
        DjangoOptimizerExtension,  # not required, but highly recommended
    ],
)
