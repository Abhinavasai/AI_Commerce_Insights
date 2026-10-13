from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

import boto3

from shared.config import get_settings
from shared.queue.base import Handler, JobMessage, JobQueue

logger = logging.getLogger(__name__)


class SqsJobQueue(JobQueue):
    def __init__(self) -> None:
        settings = get_settings()
        kwargs: dict = {"region_name": settings.aws_region}
        if settings.aws_endpoint_url:
            kwargs["endpoint_url"] = settings.aws_endpoint_url
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            kwargs["aws_access_key_id"] = settings.aws_access_key_id
            kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
        self.client = boto3.client("sqs", **kwargs)
        self.queue_url = settings.sqs_queue_url
        self._handlers: dict[str, Handler] = {}
        self._task: asyncio.Task | None = None
        self._running = False
        if not self.queue_url and settings.aws_endpoint_url:
            self.queue_url = self._ensure_queue("commerceai-jobs")

    def _ensure_queue(self, name: str) -> str:
        try:
            resp = self.client.create_queue(QueueName=name)
            return resp["QueueUrl"]
        except Exception:
            resp = self.client.get_queue_url(QueueName=name)
            return resp["QueueUrl"]

    async def publish(self, job_type: str, payload: dict[str, Any]) -> None:
        body = json.dumps({"job_type": job_type, "payload": payload})
        self.client.send_message(QueueUrl=self.queue_url, MessageBody=body)

    async def register_handler(self, job_type: str, handler: Handler) -> None:
        self._handlers[job_type] = handler

    async def start(self) -> None:
        self._running = True
        self._task = asyncio.create_task(self._poll_loop())

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _poll_loop(self) -> None:
        while self._running:
            try:
                resp = await asyncio.to_thread(
                    self.client.receive_message,
                    QueueUrl=self.queue_url,
                    MaxNumberOfMessages=5,
                    WaitTimeSeconds=10,
                    VisibilityTimeout=600,
                )
                for raw in resp.get("Messages", []):
                    await self._handle_raw(raw)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("SQS poll error")
                await asyncio.sleep(2)

    async def _handle_raw(self, raw: dict) -> None:
        try:
            data = json.loads(raw["Body"])
            msg = JobMessage(
                job_type=data["job_type"],
                payload=data.get("payload", {}),
                receipt_handle=raw.get("ReceiptHandle"),
            )
            handler = self._handlers.get(msg.job_type)
            if handler:
                await handler(msg)
            if msg.receipt_handle:
                self.client.delete_message(
                    QueueUrl=self.queue_url, ReceiptHandle=msg.receipt_handle
                )
        except Exception:
            logger.exception("Failed processing SQS message")
