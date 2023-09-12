import csv
from datetime import date, timedelta

from django.contrib.auth.mixins import PermissionRequiredMixin
from django.contrib.auth.views import LoginView
from django.db.models import F
from django.http import HttpResponse
from django.shortcuts import redirect, reverse
from django.views.generic import FormView, ListView, TemplateView

from hub.forms import ActivateUserFormSet, InactiveCheckLoginForm, SignupForm
from hub.mixins import TitleMixin
from hub.models import UserProperties
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


class AccountsView(PermissionRequiredMixin, TitleMixin, FormView):
    permission_required = "auth.edit_user"
    page_title = "Accounts"
    template_name = "hub/accounts/accounts.html"
    form_class = ActivateUserFormSet
    success_url = "/accounts/"

    def form_valid(self, form):
        self.object = form.save()
        for sub_form in form:
            if sub_form.cleaned_data["is_active"]:
                sub_form.send_notification_email(request=self.request)
        return super().form_valid(form)

    def get_context_data(self):
        context = super().get_context_data()

        time_a_week_ago = date.today() - timedelta(days=6)
        time_a_month_ago = date.today() - timedelta(days=30)

        users = UserProperties.objects.all()

        context["users"] = users.order_by(F("last_seen").desc(nulls_last=True))
        context["count_users_seen_this_week"] = users.filter(
            last_seen__gte=time_a_week_ago
        ).count()
        context["count_users_joined_this_week"] = users.filter(
            user__date_joined__gte=time_a_week_ago
        ).count()
        context["count_users_seen_this_month"] = users.filter(
            last_seen__gte=time_a_month_ago
        ).count()
        context["count_users_joined_this_month"] = users.filter(
            user__date_joined__gte=time_a_month_ago
        ).count()

        return context


class AccountsCSV(PermissionRequiredMixin, ListView):
    model = UserProperties
    queryset = UserProperties.objects.order_by(F("last_seen").desc(nulls_last=True))
    context_object_name = "users"
    permission_required = "auth.edit_user"

    def date_format(self, datetime):
        if datetime:
            return datetime.strftime("%Y-%m-%d")
        else:
            return None

    def render_to_response(self, context, **response_kwargs):
        response = HttpResponse(content_type="text/csv")
        field_names = [
            "name",
            "organisation",
            "email",
            "date_joined",
            "date_last_seen",
            "email_confirmed",
            "account_confirmed",
            "is_active",
            "is_staff",
            "is_superuser",
        ]
        writer = csv.DictWriter(response, field_names)
        writer.writeheader()
        for userprops in context["users"]:
            writer.writerow(
                {
                    "name": userprops.full_name,
                    "organisation": userprops.organisation_name,
                    "email": userprops.user.email,
                    "date_joined": self.date_format(userprops.user.date_joined),
                    "date_last_seen": self.date_format(userprops.last_seen),
                    "email_confirmed": userprops.email_confirmed,
                    "account_confirmed": userprops.account_confirmed,
                    "is_active": userprops.user.is_active,
                    "is_staff": userprops.user.is_staff,
                    "is_superuser": userprops.user.is_superuser,
                }
            )
        return response
