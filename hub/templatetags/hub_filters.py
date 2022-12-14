import re

from django import template
from django.template.defaultfilters import stringfilter
from django.utils.safestring import mark_safe

import utils as lih_utils

register = template.Library()


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
