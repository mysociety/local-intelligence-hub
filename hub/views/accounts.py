from django.contrib.auth.mixins import PermissionRequiredMixin
from django.contrib.auth.views import LoginView
from django.shortcuts import redirect, reverse
from django.views.generic import FormView, TemplateView

from hub.forms import ActivateUserFormSet, InactiveCheckLoginForm, SignupForm
from hub.mixins import TitleMixin
from hub.tokens import get_user_for_token


class LIHLoginView(LoginView):
    form_class = InactiveCheckLoginForm


class SignupView(TitleMixin, FormView):
    page_title = "Request an account"
    template_name = "hub/accounts/signup.html"
    form_class = SignupForm
    success_url = "/confirmation_sent/"

    def form_valid(self, form):
        self.object = form.save()
        form.send_confirmation_email(request=self.request, user=self.object)
        return super().form_valid(form)


class ConfirmationSentView(TitleMixin, TemplateView):
    page_title = "Verify your email"
    template_name = "hub/accounts/confirmation_sent.html"


class ConfirmEmailView(TitleMixin, TemplateView):
    page_title = "Email Confirmation"
    template_name = "hub/accounts/email_confirmation.html"

    def get(self, request, token=None):
        if token is not None:
            t, user = get_user_for_token(token)
            if t is None or user is None:
                return redirect(reverse("bad_token"))

            props = user.userproperties
            props.email_confirmed = True
            props.save()
            t.delete()

        return super().get(request)

    def get_context_data(self):
        context = super().get_context_data()

        return context


class BadTokenView(TitleMixin, TemplateView):
    page_title = "Bad Token"
    template_name = "hub/accounts/bad_token.html"


class ActivateAccountsView(PermissionRequiredMixin, TitleMixin, FormView):
    permission_required = "auth.edit_user"
    page_title = "Activate accounts"
    template_name = "hub/accounts/activate_accounts.html"
    form_class = ActivateUserFormSet
    success_url = "/activate_accounts/"

    def form_valid(self, form):
        form.save()
        return super().form_valid(form)
