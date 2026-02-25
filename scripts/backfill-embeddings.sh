#!/usr/bin/env bash
# =============================================================================
# Backfill embeddings for products that don't have them yet.
#
# Uses the generate-embedding Edge Function's backfill mode.
# Processes products in batches to avoid HF rate limits.
#
# Usage:
#   ./scripts/backfill-embeddings.sh              # default batch size 50
#   ./scripts/backfill-embeddings.sh --batch 20   # custom batch size
# =============================================================================

set -euo pipefail

BATCH_SIZE=50
DELAY_BETWEEN_BATCHES=2  # seconds

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --batch)
      BATCH_SIZE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--batch SIZE]"
      exit 1
      ;;
  esac
done

# Load env vars from .env.local if present
ENV_FILE="$(dirname "$0")/../.env.local"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a
  source <(grep -v '^#' "$ENV_FILE" | grep -v '^\s*$')
  set +a
fi

# Validate required env vars
if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
  echo "Either set them in .env.local or as environment variables."
  exit 1
fi

BASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SVC_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
FUNC_URL="${BASE_URL}/functions/v1/generate-embedding"

echo "========================================="
echo "  Embedding Backfill"
echo "========================================="
echo "  Supabase URL: ${BASE_URL}"
echo "  Batch size:   ${BATCH_SIZE}"
echo "========================================="
echo ""

TOTAL_PROCESSED=0
TOTAL_SUCCESS=0
TOTAL_FAILED=0
BATCH_NUM=0

while true; do
  BATCH_NUM=$((BATCH_NUM + 1))
  echo "--- Batch #${BATCH_NUM} (limit: ${BATCH_SIZE}) ---"

  RESPONSE=$(curl -s -X POST "${FUNC_URL}" \
    -H "Authorization: Bearer ${SVC_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"backfill\": true, \"limit\": ${BATCH_SIZE}}")

  # Parse response
  PROCESSED=$(echo "$RESPONSE" | jq -r '.processed // 0')
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success // 0')
  FAILED=$(echo "$RESPONSE" | jq -r '.failed // 0')
  REMAINING=$(echo "$RESPONSE" | jq -r '.remaining // 0')
  MESSAGE=$(echo "$RESPONSE" | jq -r '.message // empty')
  ERRORS=$(echo "$RESPONSE" | jq -r '.errors // empty')

  if [ -n "$MESSAGE" ]; then
    echo "  $MESSAGE"
    break
  fi

  TOTAL_PROCESSED=$((TOTAL_PROCESSED + PROCESSED))
  TOTAL_SUCCESS=$((TOTAL_SUCCESS + SUCCESS))
  TOTAL_FAILED=$((TOTAL_FAILED + FAILED))

  echo "  Processed: ${PROCESSED} (success: ${SUCCESS}, failed: ${FAILED})"
  echo "  Remaining: ${REMAINING}"

  if [ -n "$ERRORS" ] && [ "$ERRORS" != "null" ]; then
    echo "  Errors: ${ERRORS}"
  fi

  if [ "$REMAINING" -eq 0 ] || [ "$PROCESSED" -eq 0 ]; then
    break
  fi

  echo "  Waiting ${DELAY_BETWEEN_BATCHES}s before next batch..."
  sleep "$DELAY_BETWEEN_BATCHES"
done

echo ""
echo "========================================="
echo "  Backfill Complete"
echo "========================================="
echo "  Total processed: ${TOTAL_PROCESSED}"
echo "  Total success:   ${TOTAL_SUCCESS}"
echo "  Total failed:    ${TOTAL_FAILED}"
echo "========================================="
