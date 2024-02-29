from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator

from hub.models import Token

User = get_user_model()


def make_token_for_user(user):
    generator = PasswordResetTokenGenerator()
    token = generator.make_token(user)
    t = Token.objects.create(token=token, domain="user", domain_id=user.pk)

    return t


def get_user_for_token(token):
    try:
        t = Token.objects.get(token=token, domain="user")
    except Token.DoesNotExist:
        return None, None

    user = User.objects.get(pk=t.domain_id)
    return t, user
