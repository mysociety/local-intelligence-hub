import logging
from datetime import timedelta
from inspect import isawaitable

from django.http import HttpRequest
from django.utils.decorators import sync_and_async_middleware
from django.utils.timezone import now

from asgiref.sync import iscoroutinefunction, sync_to_async
from gqlauth.core.middlewares import USER_OR_ERROR_KEY, UserOrError
from gqlauth.core.middlewares import django_jwt_middleware as _django_jwt_middleware
from gqlauth.core.types_ import GQLAuthError, GQLAuthErrors
from whitenoise.middleware import WhiteNoiseMiddleware

from hub.models import UserProperties

logger = logging.getLogger(__name__)


@sync_and_async_middleware
def record_last_seen_middleware(get_response):
    one_day = timedelta(hours=24)

    def process_request(request):
        if request.user.is_authenticated:
            user = request.user
            props, _ = UserProperties.objects.get_or_create(user=user)
            last_seen = request.session.get("last_seen", None)
            yesterday = now().replace(hour=0, minute=0) - one_day
            if last_seen is None or last_seen < yesterday.timestamp():
                props.last_seen = now()
                request.session["last_seen"] = props.last_seen.timestamp()
                props.save()

    if iscoroutinefunction(get_response):

        async def middleware(request: HttpRequest):
            await sync_to_async(process_request)(request)
            return await get_response(request)

    else:

        def middleware(request: HttpRequest):
            process_request(request)
            return get_response(request)

    return middleware


@sync_and_async_middleware
def async_whitenoise_middleware(get_response):
    def logic(request):
        return WhiteNoiseMiddleware(get_response)(request)

    if iscoroutinefunction(get_response):

        async def middleware(request: HttpRequest):
            response = logic(request)
            if isawaitable(response):
                response = await response
            return response

    else:

        def middleware(request: HttpRequest):
            return logic(request)

    return middleware


@sync_and_async_middleware
def django_jwt_middleware(get_response):
    """
    Wrap the gqlauth jwt middleware in an exception
    handler (initially added because if a user is
    deleted, the middleware throws an error,
    causing a 500 instead of a 403).
    """
    gqlauth_middleware = _django_jwt_middleware(get_response)

    def exception_handler(error: Exception, request: HttpRequest):
        logger.warning(f"Gqlauth middleware error: {error}")
        user_or_error = UserOrError()
        user_or_error.error = GQLAuthError(code=GQLAuthErrors.UNAUTHENTICATED)
        setattr(request, USER_OR_ERROR_KEY, user_or_error)

    if iscoroutinefunction(get_response):

        async def middleware(request: HttpRequest):
            try:
                return await gqlauth_middleware(request)
            except Exception as e:
                exception_handler(e, request)
            return await get_response(request)

    else:

        def middleware(request: HttpRequest):
            try:
                return gqlauth_middleware(request)
            except Exception as e:
                exception_handler(e, request)
            return get_response(request)

    return middleware
