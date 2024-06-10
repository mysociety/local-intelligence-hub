import logging

from django.core.management.base import BaseCommand

from utils.log import get_simple_debug_logger

logger = logging.getLogger(__name__)
debug_logger = get_simple_debug_logger(__name__)


class Command(BaseCommand):
    help = "Print some test log statements to test logging config"

    def handle(self, *args, **options):
        logger.info("A", {"foo": "bar"})  # Should not print the object
        debug_logger.info("A", {"foo": "bar"})  # Should print the object
