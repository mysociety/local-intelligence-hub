from __future__ import annotations

from django.db import transaction

from procrastinate.contrib.django import app


@app.task(queue="index")
@transaction.atomic
def update_one(config_id: str, member_id: str):
    from hub.models import ExternalDataSourceUpdateConfig
    config = ExternalDataSourceUpdateConfig.objects.get(pk=config_id)
    config.update_one(member_id=member_id)


@app.task(queue="index")
def update_many(config_id: str):
    from hub.models import ExternalDataSourceUpdateConfig
    config = ExternalDataSourceUpdateConfig.objects.get(pk=config_id)
    config.update_many()