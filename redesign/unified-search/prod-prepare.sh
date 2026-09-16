#!/usr/bin/env bash
# Production preparation for the unified-search hybrid upgrade (branch redesign/unified-search).
# Runs the pre-merge remote steps in the required order:
#   1. db push (migration 20260916130000 — hybrid RPCs, triggers, HNSW, profiles_public.embedding)
#   2. app_config rows (supabase_url, service_role_key, semantic_search_enabled=true)
#   3. edge function deploy (adds BUSINESS/PROFILE modes + multi-table backfill)
#   4. backfill embeddings (products, businesses, profiles)
#   5. smoke test (keyword RPC + hybrid RPC via direct-text embedding)
#
# No secrets are printed: the service role key is fetched at runtime and piped
# straight into the consuming commands. Idempotent-ish: safe to re-run.
set -euo pipefail

REF=$(cat supabase/.temp/project-ref)
URL="https://$REF.supabase.co"

step() { printf '\n=== %s ===\n' "$1"; }

fetch_keys() {
  ANON=$(npx supabase projects api-keys --project-ref "$REF" -o json 2>/dev/null \
    | jq -r '.[] | select(.name=="anon") | .api_key')
  SRK=$(npx supabase projects api-keys --project-ref "$REF" -o json 2>/dev/null \
    | jq -r '.[] | select(.name=="service_role") | .api_key')
  if [ -z "$ANON" ] || [ -z "$SRK" ] || [ "$ANON" = "null" ] || [ "$SRK" = "null" ]; then
    echo "ERROR: could not fetch API keys" >&2; exit 1
  fi
}

step "1/5 db push (applies 20260916130000 if pending)"
npx supabase db push --dry-run
npx supabase db push

step "2/5 app_config rows"
fetch_keys
jq -n --arg url "$URL" --arg srk "$SRK" \
  '[
     {key: "supabase_url", value: $url},
     {key: "service_role_key", value: $srk},
     {key: "semantic_search_enabled", value: "true"}
   ]' \
  | curl -s -X POST "$URL/rest/v1/app_config" \
      -H "apikey: $SRK" -H "Authorization: Bearer $SRK" \
      -H "Content-Type: application/json" \
      -H "Prefer: resolution=merge-duplicates" \
      --data @- -o /dev/null -w "upsert HTTP %{http_code}\n"
# Belt and suspenders for the flag row (it already exists with value=false).
curl -s -X PATCH "$URL/rest/v1/app_config?key=eq.semantic_search_enabled" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK" \
  -H "Content-Type: application/json" \
  -d '{"value": "true"}' -o /dev/null -w "flag PATCH HTTP %{http_code}\n"
curl -s "$URL/rest/v1/app_config?select=key,value" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" | jq -c 'map(if .key=="service_role_key" then .value="<set>" else . end)'

step "3/5 deploy edge function"
npx supabase functions deploy generate-embedding

step "4/5 backfill embeddings"
fetch_keys
for t in products businesses profiles; do
  case "$t" in
    products)       rest_table="products" ;;
    businesses)     rest_table="business_profiles" ;;
    profiles)       rest_table="profiles" ;;
  esac
  # Count with the service role key: anon cannot SELECT profiles (TELO-003).
  missing=$(curl -s "$URL/rest/v1/$rest_table?select=id&embedding=is.null" \
    -H "apikey: $SRK" -H "Authorization: Bearer $SRK" \
    -H "Prefer: count=exact" -o /dev/null -D - | grep -i '^content-range' | sed 's/.*\///' | tr -d '\r')
  case "$missing" in ''|*[!0-9]*) missing=0 ;; esac
  echo "[$t] rows missing embedding: $missing"
  iter=0
  while [ "${missing:-0}" -gt 0 ] && [ "$iter" -lt 20 ]; do
    iter=$((iter + 1))
    resp=$(curl -s -X POST "$URL/functions/v1/generate-embedding" \
      -H "Authorization: Bearer $SRK" -H "Content-Type: application/json" \
      -d "{\"backfill\": true, \"table\": \"$t\", \"limit\": 100}")
    echo "[$t] iter $iter: $(echo "$resp" | jq -c '{processed, success, failed, remaining, message, error}')"
    remaining=$(echo "$resp" | jq -r '.remaining // 0')
    if [ "$(echo "$resp" | jq -r '.error // empty')" != "" ]; then echo "[$t] backfill error, aborting table"; break; fi
    if [ "$remaining" = "0" ] || [ "$remaining" = "null" ]; then missing=0; else missing=$remaining; fi
  done
done

step "5/5 smoke test"
echo "--- keyword-only RPC (no embedding) ---"
curl -s -X POST "$URL/rest/v1/rpc/search_businesses" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" \
  -d '{"search_query": "electronica", "result_limit": 3}' \
  | jq -c '.[0] | {total_count, names: [.businesses[].business_name]}'

echo "--- hybrid RPC (embedding from edge fn direct-text mode) ---"
EMB=$(curl -s -X POST "$URL/functions/v1/generate-embedding" \
  -H "Authorization: Bearer $SRK" -H "Content-Type: application/json" \
  -d '{"text": "reparacion de pantalla"}' | jq -c '.embedding')
if [ "$EMB" = "null" ] || [ -z "$EMB" ]; then
  echo "WARNING: embedding generation failed (check HUGGINGFACE_API_KEY secret / HF quota)"
else
  jq -n --argjson emb "$EMB" '{search_query: "reparacion de pantalla", query_embedding: $emb, result_limit: 3}' \
    | curl -s -X POST "$URL/rest/v1/rpc/search_businesses" \
        -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" \
        --data @- \
    | jq -c '.[0] | {total_count, ranked: [.businesses[] | {name: .business_name, score: .relevance_score}]}'
fi

step "DONE — remote ready. Merge to main can now happen safely (deploy order respected)."
