import logging
import tempfile

from django.core import files

import requests

logger = logging.getLogger(__name__)


def download_file_from_url(url):
    # Stream the image from the url
    try:
        request = requests.get(url, stream=True)
    except requests.exceptions.RequestException as e:
        logger.error(f"could not fetch url {url}: {e}")
        return None

    if request.status_code != requests.codes.ok:
        # TODO: log error here
        return None

    # Create a temporary file
    lf = tempfile.NamedTemporaryFile()

    # Read the streamed image in sections
    for block in request.iter_content(1024 * 8):

        # If no more file then stop
        if not block:
            break

        # Write image block to temporary file
        lf.write(block)

    return files.File(lf)
