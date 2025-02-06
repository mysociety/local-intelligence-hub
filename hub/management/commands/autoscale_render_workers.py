import logging
import math

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connection

from utils.render import get_render_client

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Manage Render workers"

    def handle(self, *args, **options):
        if not settings.ROW_COUNT_PER_WORKER:
            raise ValueError("settings.ROW_COUNT_PER_WORKER is required")

        with connection.cursor() as cursor:
            # Find out how many rows of data need importing, updating, so on, so forth
            cursor.execute(
                """
                    SELECT
                        multi + single as rows_to_process
                    FROM (
                        SELECT sum(jsonb_array_length(job.args->'members')) as multi, count(job.args->>'member') as single
                        FROM procrastinate_jobs job
                        WHERE status in ('doing', 'todo')
                    ) as subquery
                """
            )
            count_of_rows_to_process = cursor.fetchone()[0] or 0

            # Decide how many workers we need based on the number of rows of data
            new_worker_count = math.max(
                1, math.ceil(count_of_rows_to_process / settings.ROW_COUNT_PER_WORKER)
            )

            logger.info(
                f"Rows to process: {count_of_rows_to_process}. Ideal worker count: {new_worker_count}."
            )

            if not settings.RENDER_API_TOKEN:
                raise ValueError("settings.RENDER_API_TOKEN is required")
            if not settings.RENDER_WORKER_SERVICE_ID:
                raise ValueError("settings.RENDER_WORKER_SERVICE_ID is required")

            # Tell render
            render = get_render_client()
            render.post(
                f"/v1/services/{settings.RENDER_WORKER_SERVICE_ID}/scale",
                json={"numInstances": new_worker_count},
            )
