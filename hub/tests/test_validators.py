import os
from unittest.mock import Mock

from django.core.exceptions import ValidationError
from django.test import TestCase

from hub.restricted_file_field.validators import FileContentTypeValidator

from .utils import get_extras_file, get_uploaded_file


class TestFileContentTypeValidator(TestCase):
    def test_correct_content_type(self):
        f = get_uploaded_file(get_extras_file("sample.jpg"))

        validator = FileContentTypeValidator()

        validator(f)

    def test_no_content_type(self):
        f = get_uploaded_file(get_extras_file("sample.jpg"), content_type=False)

        validator = FileContentTypeValidator()

        validator(f)

    def test_incorrect_content_type(self):
        f = get_uploaded_file(get_extras_file("sample.jpg"), content_type="image/png")

        validator = FileContentTypeValidator()

        with self.assertRaises(ValidationError):
            validator(f)

    def test_incorrect_content_type2(self):
        f = get_uploaded_file(
            get_extras_file("sample.jpg"),
            content_type="image/png",
            upload_name="sample.png",
        )

        validator = FileContentTypeValidator()

        with self.assertRaises(ValidationError):
            validator(f)

    def test_incorrect_content_type3(self):
        f = get_uploaded_file(get_extras_file("sample.jpg"), upload_name="sample.png")

        validator = FileContentTypeValidator()

        with self.assertRaises(ValidationError):
            validator(f)

    def test_no_content_type_with_bad_ext(self):
        f = get_uploaded_file(
            get_extras_file("sample.jpg"), content_type=False, upload_name="sample.png"
        )

        validator = FileContentTypeValidator()

        with self.assertRaises(ValidationError):
            validator(f)

    def test_not_uploadedfile_instance(self):
        f = get_uploaded_file(get_extras_file("sample.jpg"))
        m = Mock()
        m._get_file = lambda: f

        validator = FileContentTypeValidator()

        validator(m)
