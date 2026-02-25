# Search Fix: Production Deployment Risk Analysis & Recommendations

**Context:** PostgREST silently drops `fts_query` parameter. Fix encodes expanded FTS query in `search_query`; SQL auto-detects tsquery format via regex.

**Date:** February 23, 2026

---

## 1. Safer Migration Strategy

### 1.1 Can We Avoid DROP?

**No.** PostgreSQL does not allow `CREATE OR REPLACE` to change a function's parameter signature. Different signatures create overloaded functions; changing the signature requires `DROP` first. This is a PostgreSQL limitation, not a migration design choice.

### 1.2 Transaction Atomicity (Key Insight)

**Supabase migrations run each migration file in a single transaction.** Within one migration:

- `DROP FUNCTION` + `CREATE OR REPLACE` + `GRANT` execute atomically
- Other sessions either see the **old** function (before commit) or the **new** function (after commit)
- There is **no window** where the function does not exist—DDL changes are invisible until commit

**Conclusion:** The DROP/CREATE sequence is safe when executed in one migration file. No additional wrapping needed.

### 1.3 Actionable Migration Improvements

| Action | Priority | Details |
|--------|----------|---------|
| **Resolve duplicate migrations** | **Critical** | Two files share timestamp `20260223200000`: `fix_fts_query_postgrest_workaround.sql` and `fix_synonym_expansion_postgrest.sql`. Keep one; delete or rename the other. Use a unique timestamp (e.g. `20260223210000`) for the canonical fix. |
| **Add explicit transaction wrapper** | Optional | Add `BEGIN;` at top and `COMMIT;` at end for clarity and defense-in-depth. Supabase may already wrap; explicit is harmless. |
| **Deploy during low-traffic window** | Recommended | Even though migration is atomic, deploy during low traffic to minimize any edge-case impact. |
| **Verify migration order** | Required | Ensure `20260223180000_search_quality_improvements.sql` has run before this fix. The DROP targets functions created in that migration. |

### 1.4 Blue/Green Not Applicable

Blue/green deployment for database functions is not practical with Supabase:

- Single PostgreSQL instance; no separate blue/green DBs
- Function definitions are schema-level; no per-connection routing
- PostgREST/API layer would need to route to different function versions—not supported

**Recommendation:** Rely on transaction atomicity. The migration is low-risk if applied correctly.

---

## 2. Regex Pattern Robustness

### 2.1 Current Pattern

```sql
v_trimmed ~ ' \| | & '
```

Matches: `" | "` (space-pipe-space) OR `" & "` (space-ampersand-space).

### 2.2 Analysis

| Scenario | expandQuery output | Regex match? | Result |
|----------|--------------------|-------------|--------|
| Single word with synonyms | `telefono \| celular \| smartphone` | Yes (` \| `) | `to_tsquery` ✓ |
| Multi-word | `( celular \| telefono ) & samsung` | Yes (` \| ` and ` & `) | `to_tsquery` ✓ |
| Plain user input | `celular samsung` | No | `plainto_tsquery` ✓ |
| User types `a \| b` literally | `a & b` (pipe stripped by `sanitizeTsqueryToken`) | No | `plainto_tsquery` ✓ |
| Empty/punctuation only | `null` or raw `\|` | No | `plainto_tsquery` (may yield empty) |

**Key insight:** `expandQuery` strips non-alphanumeric characters from tokens. User-typed `|` or `&` never reach the SQL. The only source of `|` and `&` is `expandQuery` output.

### 2.3 Edge Case: Literal `|` in Search

If a user types `"a | b"` and it were passed raw (e.g. if `expandQuery` returned null):

- `expandQuery("a | b")` splits to `["a", "|", "b"]`; `sanitizeTsqueryToken("|")` → `""`; result is `"a & b"` (no pipe)
- So we never pass literal `|` from user input

**Verdict:** The regex is **robust for production**. The `|`/`&` edge case is theoretical; current flow prevents it.

### 2.4 Optional Hardening

If you want extra safety against malformed input:

```sql
-- Safer: also check for parentheses (expandQuery wraps OR-groups)
IF v_trimmed ~ ' \| | & | \( .+ \| ' THEN
  v_tsquery := to_tsquery('spanish', v_trimmed);
ELSE
  v_tsquery := plainto_tsquery('spanish', v_trimmed);
END IF;
```

**Recommendation:** Keep the current pattern. It matches all real `expandQuery` outputs. Add the stricter check only if you introduce new query formats later.

---

## 3. Additional Production Hardening

### 3.1 Logging Volume

**Risk:** Every search logs a JSON line. At scale (e.g. 10K searches/day), this can be noisy.

**Options:**

| Option | Implementation | Trade-off |
|--------|----------------|-----------|
| **A. Log level gate** | `if (process.env.NODE_ENV === 'development' \|\| process.env.SEARCH_DEBUG === 'true')` | Reduces prod logs; loses observability |
| **B. Sampling** | Log 1% of requests: `if (Math.random() < 0.01)` | Keeps signal, cuts volume |
| **C. Structured + aggregation** | Log to external APM (e.g. Vercel Analytics, Datadog) | Best observability; extra setup |
| **D. Keep as-is for MVP** | No change | Acceptable for <1K users/day |

**Recommendation:** For MVP, keep current logging. Add sampling (Option B) when search volume exceeds ~1K/day. Use `zeroResults` and `embeddingFailed` for alerting.

### 3.2 Semantic Thresholds

| Table | Threshold | Risk |
|-------|-----------|------|
| Products | 0.70 cosine distance | HuggingFace model change could shift distribution |
| Demands | 0.65 cosine distance | Same |

**Recommendation:** Move thresholds to `app_config` or env vars for tuning without migrations:

```sql
-- Optional: add to app_config
INSERT INTO app_config (key, value) VALUES 
  ('semantic_threshold_products', '0.70'),
  ('semantic_threshold_demands', '0.65')
ON CONFLICT (key) DO NOTHING;
```

Then read in SQL via `(SELECT value::float FROM app_config WHERE key = 'semantic_threshold_products')`. Defer until you observe model drift.

### 3.3 API Route Resilience

**Current:** Embedding failure → fallback to keyword-only. Good.

**Optional additions:**

- **Retry on RPC error:** One retry with 500ms delay before returning 500
- **Circuit breaker:** If embedding API fails N times in a window, temporarily disable semantic search (already have `isSemanticSearchEnabled`)

**Recommendation:** Add retry only if you see transient HuggingFace failures. Circuit breaker is a later optimization.

### 3.4 Pre-Deployment Checklist

- [ ] Remove duplicate migration file (keep one of the two `20260223200000` files)
- [ ] Run `supabase db reset` locally to verify migration order
- [ ] Confirm `20260223180000` has been applied in production
- [ ] Deploy API route changes **before** running migration (API already sends `search_query` without `fts_query`)
- [ ] Run migration: `supabase db push`
- [ ] Smoke test: search for "chompa", "celular", "telefono" and verify synonym expansion
- [ ] Monitor logs for `embedding_failure` and `zeroResults` in first 24h

---

## 4. Summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| DROP/CREATE window | **Low** | Migration runs in single transaction; no gap |
| Literal `\|` in search | **Very Low** | expandQuery strips it; regex is safe |
| Semantic thresholds | **Low** | Monitor; move to config if model changes |
| Log volume | **Medium** | Add sampling when traffic grows |
| Duplicate migrations | **High** | Resolve before deploy |

**Bottom line:** The migration is production-ready. Resolve the duplicate migration file, deploy during low traffic, and monitor search quality and logs post-deploy.
