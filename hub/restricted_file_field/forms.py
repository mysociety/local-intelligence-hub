# From https://github.com/mixkorshun/django-safe-filefield/blob/master/safe_filefield/forms.py

from django import forms
from django.core.validators import FileExtensionValidator

from .validators import FileContentTypeValidator


class SafeFileField(forms.FileField):
    def __init__(self, **kwargs):
        self.allowed_extensions = kwargs.pop("allowed_extensions", None)
        self.check_content_type = kwargs.pop("check_content_type", True)
        self.scan_viruses = kwargs.pop("scan_viruses", False)

        default_validators = []

        if self.allowed_extensions:
            default_validators.append(FileExtensionValidator(self.allowed_extensions))

        if self.check_content_type:
            default_validators.append(FileContentTypeValidator())

        self.default_validators = default_validators + self.default_validators

        super().__init__(**kwargs)
