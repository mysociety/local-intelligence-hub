from django.template.base import TemplateSyntaxError, token_kwargs
from django.template.library import Library
from django.template.loader_tags import IncludeNode, construct_relative_path

register = Library()

"""
It is not really possibly to override only the few small lines of the existing include tag to
do what I want, add a second template path with the site name prefixed, so this sadly includes
more or less all the code of the existing tags in here with the three or four small changes
required.
"""


class SiteIncludeNode(IncludeNode):
    def render(self, context):
        template = self.template.resolve(context)
        # Does this quack like a Template?
        if not callable(getattr(template, "render", None)):
            # If not, try the cache and select_template().
            template_name = template or ()
            if isinstance(template_name, str):
                base_name = construct_relative_path(
                    self.origin.template_name,
                    template_name,
                )

                """
                Add a second path that includes the site_path from context to the template
                tuple so we will use a site template first, otherwise fall back to the standard one
                """
                if context.get("site_path"):
                    template_name = (
                        f"{context['site_path']}{base_name}",
                        base_name,
                    )
                else:
                    template_name = (base_name,)
            else:
                template_name = tuple(template_name)
            cache = context.render_context.dicts[0].setdefault(self, {})
            template = cache.get(template_name)
            if template is None:
                template = context.template.engine.select_template(template_name)
                cache[template_name] = template
        # Use the base.Template of a backends.django.Template.
        elif hasattr(template, "template"):
            template = template.template
        values = {
            name: var.resolve(context) for name, var in self.extra_context.items()
        }
        if self.isolated_context:
            return template.render(context.new(values))
        with context.push(**values):
            return template.render(context)


@register.tag(name="site_include")
def do_site_include(parser, token):
    """
    we could possibly just call the core do_include method here and then use the returned
    Node to create a new SiteIncludeNode but then you'd be doing a lot of work twice so
    for now we're just re-implementing the whole thing
    """
    bits = token.split_contents()
    if len(bits) < 2:
        raise TemplateSyntaxError(
            "%r tag takes at least one argument: the name of the template to "
            "be included." % bits[0]
        )
    options = {}
    remaining_bits = bits[2:]
    while remaining_bits:
        option = remaining_bits.pop(0)
        if option in options:
            raise TemplateSyntaxError(
                "The %r option was specified more than once." % option
            )
        if option == "with":
            value = token_kwargs(remaining_bits, parser, support_legacy=False)
            if not value:
                raise TemplateSyntaxError(
                    '"with" in %r tag needs at least one keyword argument.' % bits[0]
                )
        elif option == "only":
            value = True
        else:
            raise TemplateSyntaxError(
                "Unknown argument for %r tag: %r." % (bits[0], option)
            )
        options[option] = value
    isolated_context = options.get("only", False)
    namemap = options.get("with", {})
    bits[1] = construct_relative_path(
        parser.origin.template_name,
        bits[1],
    )
    # creating a SiteIncludeNode here is the only difference from the core tag :|
    return SiteIncludeNode(
        parser.compile_filter(bits[1]),
        extra_context=namemap,
        isolated_context=isolated_context,
    )
