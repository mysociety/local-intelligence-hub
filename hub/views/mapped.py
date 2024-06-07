import json
from logging import getLogger

from django.http import HttpRequest, JsonResponse
from django.views.generic import View

from hub import models

logger = getLogger(__name__)


class ExternalDataSourceAutoUpdateWebhook(View):
    base_path = "webhook/auto_update"

    def get(self, request: HttpRequest, *args, **kwargs):
        external_data_source_id = self.kwargs["external_data_source_id"]
        data = request.GET.dict()
        return self.handle(request, external_data_source_id, data)

    def post(self, request: HttpRequest, *args, **kwargs):
        external_data_source_id = self.kwargs["external_data_source_id"]

        data = None
        try:
            data = json.loads(request.body)
        except json.decoder.JSONDecodeError:
            data = request.POST.dict()

        if not data:
            return JsonResponse({"status": "Could not read the webhook payload"})

        return self.handle(request, external_data_source_id, data)

    def handle(self, request, external_data_source_id: str, data: dict):
        logger.info(f"Webhook received {self.kwargs} {data}")
        # 1. Match the payload to a ExternalDataSource
        external_data_source: models.ExternalDataSource = models.ExternalDataSource.objects.filter(
            id=external_data_source_id
        ).first()
        if not external_data_source:
            logger.info("Webhook ignored: Data source not found.")
            return JsonResponse({"status": "Data source not found."})
        if not external_data_source.auto_update_enabled:
            logger.info("Webhook ignored: Webhook is not enabled.")
            return JsonResponse({"status": "Webhook is not enabled."})
        return external_data_source.handle_update_webhook_view(data)
    

class ExternalDataSourceAutoImportWebhook(ExternalDataSourceAutoUpdateWebhook):
    base_path = "webhook/auto_import"

    def handle(self, request, external_data_source_id: str, data: dict):
        logger.info(f"Webhook received {self.kwargs} {data}")
        # 1. Match the payload to a ExternalDataSource
        external_data_source: models.ExternalDataSource = models.ExternalDataSource.objects.filter(
            id=external_data_source_id
        ).first()
        if not external_data_source:
            logger.info("Webhook ignored: Data source not found.")
            return JsonResponse({"status": "Data source not found."})
        if not external_data_source.auto_import_enabled:
            logger.info("Webhook ignored: Webhook is not enabled.")
            return JsonResponse({"status": "Webhook is not enabled."})
        return external_data_source.handle_import_webhook_view(data)
