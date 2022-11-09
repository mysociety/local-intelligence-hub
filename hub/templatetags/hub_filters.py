import re

from django import template
from django.template.defaultfilters import stringfilter
from django.utils.safestring import mark_safe

register = template.Library()


@register.filter(name="highlight")
def highlight(text, search):
    rgx = re.compile(re.escape(search), re.IGNORECASE)
    html = rgx.sub(lambda m: f"<mark>{m.group()}</mark>", text)
    return mark_safe(html)


@register.filter
@stringfilter
def domain_human(value):
    return re.sub(r"^(https?:[/][/])?(www[.])?([^/]+).*", r"\3", value)


@register.filter
@stringfilter
def url_human(value):
    return re.sub(r"^(https?:[/][/])?(www[.])?(.*)", r"\3", value)
