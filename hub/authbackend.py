from django.contrib.auth import authenticate
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
from django.contrib.sites.models import Site


class SiteBasedAuthBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None):
        """
        check if a user has access to a site once we've authenticated them
        """
        # TODO: do this as one step
        user = super().authenticate(request, username=username, password=password)
        site = Site.objects.get_current(request)
        if user and (
            user.is_superuser or user.userproperties.sites.filter(id=site.id).exists()
        ):
            return user
        else:
            return None
