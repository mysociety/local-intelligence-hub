from strawberry.extensions import SchemaExtension
from gqlauth.core.utils import app_settings
from gqlauth.core.middlewares import UserOrError, get_user_or_error
from gqlauth.jwt.types_ import TokenType
from hub.models import APIToken
import posthog
 
class APIAnalyticsExtension(SchemaExtension):
    def on_operation(self):
        request = self.execution_context.context.request
        if token_str := app_settings.JWT_TOKEN_FINDER(request):
            try:
                token = TokenType.from_token(token=token_str)
            except Exception as e:
                pass
        signature = token.split(".")[2]
        db_token = APIToken.objects.filter(signature=signature).first()
        if db_token is not None:
            print("Third party API call.")
            user_or_error: UserOrError = get_user_or_error(request)
            if user_or_error.error:
                raise ValueError("User not found")
            if db_token.revoked:
                raise ValueError("Token has been revoked")
            posthog.capture(user_or_error.user.id, "API request", {
                "operation_name": self.execution_context.operation_name,
                "operation_type": self.execution_context.operation_type
            })
        yield