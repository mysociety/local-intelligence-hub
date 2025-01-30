from hub.restricted_file_field.utils import detect_content_type

from .utils import get_extras_file, get_uploaded_file


def test_detect_content_type():
    f = get_uploaded_file(get_extras_file("sample.jpg"))
    content_type = detect_content_type(f)
    assert content_type == "image/jpeg"


def test_detect_content_type_rewind():
    f = get_uploaded_file(get_extras_file("sample.jpg"))

    detect_content_type(f)

    assert f.tell() == 0
