#!/bin/bash
set -euo pipefail
awslocal s3 mb s3://commerceai-documents || true
awslocal sqs create-queue --queue-name commerceai-jobs || true
awslocal sqs create-queue --queue-name commerceai-jobs-dlq || true
echo "LocalStack S3 + SQS ready"
