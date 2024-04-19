import posthog
from gqlauth.core.utils import app_settings
from graphql import ExecutionResult as GraphQLExecutionResult
from graphql.error import GraphQLError
from strawberry.extensions import SchemaExtension

from hub.models import APIToken, get_api_token


class APIAnalyticsExtension(SchemaExtension):
    def on_operation(self):
        yield
        request = self.execution_context.context.request
        if token_str := app_settings.JWT_TOKEN_FINDER(request):
            try:
                signature = token_str.split(".")[2]
            except IndexError:
                self.execution_context.result = GraphQLExecutionResult(
                    data=None,
                    errors=[GraphQLError("Invalid auth token")],
                )
                return
            try:
                db_token = get_api_token(signature)
                if db_token is not None:
                    if db_token.revoked:
                        self.execution_context.result = GraphQLExecutionResult(
                            data=None,
                            errors=[GraphQLError("Token has been revoked")],
                        )
                    if not posthog.disabled:
                        posthog.capture(
                            db_token.user_id,
                            "API request",
                            {
                                "operation_name": self.execution_context.operation_name,
                                "operation_type": self.execution_context.operation_type,
                            },
                        )
                    else:
                        print("API request run by User ID", db_token.user_id)
            except APIToken.DoesNotExist:
                pass
