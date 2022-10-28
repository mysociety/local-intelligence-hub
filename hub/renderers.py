from django_bootstrap5.renderers import FieldRenderer


# Defining a custom field renderer that doesn’t apply "is-valid"
# success classes, even if the field is valid.
class CustomFieldRenderer(FieldRenderer):
    def get_server_side_validation_classes(self):
        """Return CSS classes for server-side validation."""
        if self.field_errors:
            return "is-invalid"
        return ""
