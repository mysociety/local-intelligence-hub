from django.views.generic import TemplateView

from hub.mixins import TitleMixin

cache_settings = {
    "max-age": 60,
    "s-maxage": 3600,
}


class SignupView(TitleMixin, TemplateView):
    page_title = "sign up"
    template_name = "hub/accounts/signup.html"
