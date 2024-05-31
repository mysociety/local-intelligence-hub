from urllib.parse import urlparse


def get_hostname_from_url(url: str) -> str:
    """
    E.g. http://united.localhost:3000/blah -> united.localhost
    """
    parsed = urlparse(url)
    return parsed.hostname
