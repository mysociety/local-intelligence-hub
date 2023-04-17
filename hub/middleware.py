from datetime import timedelta

from django.conf import settings
from django.http import HttpResponseRedirect
from django.urls import reverse_lazy
from django.utils.timezone import now

from hub.models import UserProperties


def redirect_to_login():
    return HttpResponseRedirect(reverse_lazy("login"))


class AuthPageProtectionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if (
            request.path not in settings.NON_LOGIN_URLS
            and not request.path.startswith("/activate/")
            and not request.path.startswith("/__debug__/")
            and not request.user.is_authenticated
        ):
            return redirect_to_login()

        response = self.get_response(request)

        return response


class RecordLastSeenMiddleware:
    one_day = timedelta(hours=24)

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            user = request.user
            if not hasattr(user, "userproperties"):
                UserProperties.objects.create(user=user)

            last_seen = request.session.get("last_seen", None)

            yesterday = now().replace(hour=0, minute=0) - self.one_day

            if last_seen is None or last_seen < yesterday.timestamp():
                props = user.userproperties
                props.last_seen = now()
                request.session["last_seen"] = props.last_seen.timestamp()
                props.save()

        response = self.get_response(request)

        return response
