from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import EmailMessage
from django.forms import CharField, EmailField
from django.template.loader import render_to_string

from hub.tokens import make_token_for_user

User = get_user_model()


class SignupForm(UserCreationForm):
    username = EmailField(label="Email")
    organisation = CharField()

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = user.username
        user.is_active = False

        if commit:
            user.save()

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
        print("email sent!")

    class Meta:
        model = User
        fields = ("username", "password1", "password2", "organisation")
