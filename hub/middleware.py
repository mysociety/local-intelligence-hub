from datetime import timedelta

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
