import argparse
import logging
import subprocess
import sys

from django.conf import settings
from django.core.management.base import BaseCommand

from procrastinate import cli
from watchdog.events import FileSystemEvent, PatternMatchingEventHandler
from watchdog.observers import Observer

logger = logging.getLogger(__name__)


class TerminateWorkerEventHandler(PatternMatchingEventHandler):
    """
    Terminate the worker_process when file changes are detected.
    This unblocks the main thread, which has to wait for
    worker_process to complete before starting a new
    process.
    """

    def __init__(self):
        self.worker_process: subprocess.Popen | None = None
        super().__init__(patterns=["*.py"])

    def on_modified(self, event: FileSystemEvent) -> None:
        logger.info(str(event))
        if self.worker_process:
            self.worker_process.terminate()


class Command(BaseCommand):
    """
    Wraps the `procrastinate worker` command in watchdog,
    to restart when files change.

    Should only be used in development.

    E.G. python manage.py runworker
    """

    def add_arguments(self, parser):
        """
        Taken from procrastinate/contrib/django/management/commands/procrastinate.py

        Copies the worker command arguments from procrastinate and returns them, so that
        the user can get useful output from `python manage.py runworker --help`.
        """
        self._django_options = {a.dest for a in parser._actions}
        temp_parser = argparse.ArgumentParser()
        subparsers = temp_parser.add_subparsers(dest="command")
        cli.configure_worker_parser(subparsers)
        worker_parser = subparsers._name_parser_map["worker"]
        for action in worker_parser._actions:
            if action.dest not in self._django_options:
                parser._add_action(action)

    def handle(self, *args, **kwargs):
        """
        Starts two threads:

        1. The main thread: an infinite loop that starts a worker process, waits for it to
                            complete, then repeats.

        2. The event observer thread: terminates the current worker process when file changes
                                      are detected.

        When the event observer terminates the worker process, it unblocks the main thread,
        allowing it to loop and restart the worker.

        The event observer cannot do both, as it can't wait for the worker and listen to
        file changes at the same time.
        """
        procrastinate_args = []
        for arg in sys.argv:
            if arg == "runworker":
                procrastinate_args.append("procrastinate")
                procrastinate_args.append("worker")
            else:
                procrastinate_args.append(arg)

        print("Starting worker as subprocess and listening for file changes...")

        event_handler = TerminateWorkerEventHandler()
        observer = Observer()
        observer.schedule(event_handler, settings.BASE_DIR, recursive=True)
        # Starts event listener thread
        observer.start()

        while True:
            worker_process = subprocess.Popen([sys.executable, *procrastinate_args])
            # Save the active worker process on the event handler.
            event_handler.worker_process = worker_process
            # Waiting is necessary for correct process and signal handling.
            # When the worker process is terminated by the event handler, this wait()
            # completes and the loop restarts.
            event_handler.worker_process.wait()
