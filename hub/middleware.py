from datetime import timedelta

from django.contrib.sites.models import Site
from django.utils.timezone import now

from hub.models import UserProperties


class RecordLastSeenMiddleware:
    one_day = timedelta(hours=24)

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.GET.get("area_action"):
            request.session["area_action"] = request.GET["area_action"]

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


class AddSiteContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_template_response(self, request, response):
        context = response.context_data
        site = Site.objects.get_current(request)

        context["site"] = site.name
        context["site_path"] = f"{site.name}/"
        response.context_data = context

        return response
