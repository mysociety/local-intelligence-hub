from django.http import HttpResponseRedirect
from django.urls import reverse_lazy
from django.conf import settings


def redirect_to_login():
    return HttpResponseRedirect(reverse_lazy("login"))


class AuthPageProtectionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if (
            not request.path in settings.NON_LOGIN_URLS
            and not request.path.startswith("/__debug__/")
            and not request.user.is_authenticated
        ):
            return redirect_to_login()

        response = self.get_response(request)

        return response
