from __future__ import annotations

from django.db import transaction

from procrastinate.contrib.django import app


@app.task(queue="index")
@transaction.atomic
async def update_one(job_id: str, member_id: int):
    from hub.models import ExternalDataSourceUpdateConfig
    job = ExternalDataSourceUpdateConfig.objects.get(id=job_id)
    await job.data_source.update_one(member_id)


@app.task(queue="index")
async def update_many(job_id: str):
    from hub.models import ExternalDataSourceUpdateConfig
    job = ExternalDataSourceUpdateConfig.objects.get(id=job_id)
    await job.data_source.update_many()