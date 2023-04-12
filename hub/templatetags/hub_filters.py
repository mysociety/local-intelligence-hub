import re
from urllib.parse import urlencode

from django import template
from django.contrib.auth import get_user_model
from django.template.defaultfilters import stringfilter
from django.utils.safestring import mark_safe

import utils as lih_utils

register = template.Library()
User = get_user_model()


@register.filter(name="highlight")
def highlight(text, search):
    rgx = re.compile(re.escape(search), re.IGNORECASE)
    html = rgx.sub(lambda m: f"<mark>{m.group()}</mark>", text)
    return mark_safe(html)


@register.filter
@stringfilter
def domain_human(value):
    return lih_utils.domain_human(value)


@register.filter
@stringfilter
def url_human(value):
    return lih_utils.url_human(value)


@register.filter
@stringfilter
def simplify_dataset_name(value):
    trimmed = re.sub(r"^Number of ", "", value)
    return trimmed[0].upper() + trimmed[1:]


@register.simple_tag
def urlencode_params(**kwargs):
    """
    Return encoded URL parameters
    """
    return urlencode(kwargs)


@register.simple_tag
def pending_account_requests(**kwargs):
    """
    Return number of account requests
    """
    return User.objects.filter(
        is_active=False,
        userproperties__email_confirmed=True,
        userproperties__account_confirmed=False,
    ).count()
