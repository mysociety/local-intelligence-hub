from django.http import HttpRequest

import posthog
from asgiref.sync import sync_to_async
from gqlauth.core.middlewares import get_user_or_error
from gqlauth.core.utils import app_settings
from graphql import ExecutionResult as GraphQLExecutionResult, OperationType
from graphql.error import GraphQLError
from strawberry.extensions import SchemaExtension
from strawberry_django.auth.utils import get_current_user



from django.http import HttpRequest

import posthog
import strawberry
from strawberry.extensions import SchemaExtension
from strawberry_django.auth.utils import get_current_user


class APIAnalyticsExtension(SchemaExtension):
    @sync_to_async
    def resolve(self, _next, root, info: strawberry.Info, *args, **kwargs):
        user = get_current_user(info)

        if user and root is None and self.execution_context.operation_name != "IntrospectionQuery":
            payload = {
                "context": "private_api",
                "operation_name": self.execution_context.operation_name,
                "operation_type": self.execution_context.operation_type,
                **get_request_info(self.execution_context.context.request),
            }

            if not posthog.disabled:
                posthog.identify(user.id, {"email": user.email})
                posthog.capture(user.id, "API request", payload)

        return _next(root, info, *args, **kwargs)


def get_request_info(request: HttpRequest):
    return {
        # Request info
        "path": request.path,
        "method": request.method,
        "headers": dict(request.headers),
        "query_params": dict(request.GET),
        # Client info
        "ip": request.META.get("REMOTE_ADDR"),
        "user_agent": request.META.get("HTTP_USER_AGENT"),
        "referrer": request.META.get("HTTP_REFERER"),
        "language": request.META.get("HTTP_ACCEPT_LANGUAGE"),
    }
