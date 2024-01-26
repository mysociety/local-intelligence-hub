from django.contrib.auth import get_user_model
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.sites.shortcuts import get_current_site
from django.core.exceptions import ValidationError
from django.core.mail import EmailMessage
from django.forms import (
    BaseModelFormSet,
    BooleanField,
    CharField,
    EmailField,
    ModelForm,
    modelformset_factory,
)
from django.template.loader import render_to_string
from django.utils.safestring import mark_safe

from hub.models import UserProperties
from hub.tokens import make_token_for_user

User = get_user_model()


class SignupForm(UserCreationForm):
    username = EmailField(label="Email")
    organisation = CharField()
    full_name = CharField()
    terms = BooleanField(
        required=True,
        label=mark_safe(
            'I agree to the <a href="/terms/" target="_blank">Terms of use</a> and will use the Local Intelligence Hub in the spirit in which it was developed'
        ),
        error_messages={"required": "You must accept the Terms of use"},
    )

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = user.username
        user.is_active = False

        props = UserProperties(
            user=user,
            organisation_name=self.cleaned_data.get("organisation"),
            full_name=self.cleaned_data.get("full_name"),
            agreed_terms=self.cleaned_data.get("terms"),
        )

        if commit:
            user.save()
            props.save()

        return user

    def send_confirmation_email(self, request=None, user=None):
        t = make_token_for_user(self.instance)

        current_site = get_current_site(request)
        mail_subject = render_to_string(
            "hub/accounts/confirmation_email_subject.txt"
        ).strip()
        message = render_to_string(
            "hub/accounts/confirmation_email.html",
            {
                "user": user,
                "domain": current_site.domain,
                "token": t.token,
            },
        )
        to_email = user.email
        email = EmailMessage(mail_subject, message, to=[to_email])
        email.send()

    class Meta:
        model = User
        fields = (
            "username",
            "password1",
            "password2",
            "full_name",
            "organisation",
        )


class ActivateUserForm(ModelForm):
    def save(self, commit=True):
        user = super().save(commit=False)

        props = user.userproperties
        props.account_confirmed = True

        if commit:
            props.save()
            user.save()

        return user

    def send_notification_email(self, request=None):
        user = self.cleaned_data["id"]
        current_site = get_current_site(request)
        mail_subject = render_to_string(
            "hub/accounts/activated_email_subject.txt"
        ).strip()
        message = render_to_string(
            "hub/accounts/activated_email.html",
            {
                "user": user,
                "domain": current_site.domain,
            },
        )
        to_email = user.email
        email = EmailMessage(mail_subject, message, to=[to_email])
        email.send()

    class Meta:
        model = User
        fields = ["is_active", "id"]


class BaseActivateUserFormSet(BaseModelFormSet):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.queryset = User.objects.filter(
            is_active=False,
            userproperties__email_confirmed=True,
            userproperties__account_confirmed=False,
        ).order_by("date_joined")


ActivateUserFormSet = modelformset_factory(
    User,
    form=ActivateUserForm,
    edit_only=True,
    formset=BaseActivateUserFormSet,
    extra=0,
)


class InactiveCheckLoginForm(AuthenticationForm):
    def confirm_login_allowed(self, user):
        if not user.is_active:
            props = user.userproperties

            if props.account_confirmed:
                raise ValidationError(
                    self.error_messages["inactive"],
                    code="inactive",
                )
            elif not props.email_confirmed:
                raise ValidationError(
                    "Please confirm your email address", code="inactive"
                )
            elif props.email_confirmed:
                raise ValidationError(
                    "Your account hasn’t been approved yet", code="inactive"
                )

            else:
                raise ValidationError(
                    self.error_messages["inactive"],
                    code="inactive",
                )
