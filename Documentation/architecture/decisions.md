# Decisiones arquitecturales (ADRs)

Registros de las decisiones clave de diseño y sus *tradeoffs*. Formato corto: Contexto · Decisión · Consecuencias.

---

## ADR-001 — pgvector dentro de Supabase para búsqueda semántica

**Estado:** Aceptado (M4, feb 2026)

**Contexto:** El diferenciador del producto es búsqueda semántica. Opciones: (a) BD vectorial externa (Pinecone/Weaviate), (b) embeddings en PostgreSQL vía `pgvector`, (c) sin semántica.

**Decisión:** `pgvector` dentro del mismo PostgreSQL de Supabase. Índice HNSW, `vector_cosine_ops`, embeddings de 384d.

**Consecuencias:**
- ✅ Un solo backend (Supabase). Consistencia transaccional entre producto y su vector. $0 en MVP. Sin servicio extra que operar.
- ✅ Búsqueda híbrida (FTS + vector) en una sola query vía RPC.
- ⚠️ Escalado limitado vs. BD vectorial dedicada (ok para MVP ~miles de productos; revisar al crecer).
- ⚠️ Depende de la extensión `pgvector` instalada en Supabase.

---

## ADR-002 — Server Actions para mutaciones, API routes sólo para lectura pública

**Estado:** Aceptado (M2+, en curso — ver TELO-004)

**Contexto:** Next.js App Router ofrece Server Actions y API routes. ¿Dónde poner la lógica de escritura (crear producto, oferta, editar perfil)?

**Decisión:** Mutaciones vía **Server Actions** en `lib/actions/` con Zod + `stripHtml()`. API routes (`/api/*`) reservadas para endpoints **públicos** que no encajan en una action (búsqueda).

**Consecuencias:**
- ✅ Type-safe end-to-end, co-localización con validación, progressive enhancement, menos boilerplate REST.
- ✅ Superficie pública mínima (sólo 3 rutas API).
- ⚠️ TELO-004 (parcial): algunas escrituras aún client→Supabase (avatar, status, onboarding). Migración en curso.
- ⚠️ Las actions no son invocables vía URLexterna → ok para este producto, pero testing E2E debe usar la UI.

---

## ADR-003 — Hugging Face Inference API para generar embeddings

**Estado:** Aceptado (M4)

**Contexto:** Necesitamos generar embeddings de texto → vector. Opciones: self-host del modelo, OpenAI/proprietario, Hugging Face Inference API.

**Decisión:** Hugging Face Inference API, modelo `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (384d), invocado desde Edge Function `generate-embedding` (Deno).

**Consecuencias:**
- ✅ Multilingüe (español/boliviano), modelo pequeño (118MB), free tier 30K req/mes, serverless.
- ⚠️ Latencia de red + límites del free tier (rate-limit). Backpressure a escala.
- ⚠️ Dependencia de un servicio externo. **Mitigado:** `/api/search` cae gracefully a keyword-only si falla el embedding (flag `semantic_search_enabled` en `app_config`).

---

## ADR-004 — Husky pre-commit como CI, sin GitHub Actions

**Estado:** Aceptado (re-evaluar pre-launch)

**Contexto:** Fase MVP, dev solo. ¿CI en servidor (GitHub Actions) o local (pre-commit)?

**Decisión:** **Husky + lint-staged** local: ESLint + Prettier + `normalize-next-env` en pre-commit. Sin workflows de GitHub Actions. Deploy vía integración git de Vercel.

**Consecuencias:**
- ✅ Feedback instantáneo local, $0, cero runners que mantener, adecuado para MVP.
- ⚠️ **No se fuerza server-side:** se puede eludir con `--no-verify`. No hay gate en PR.
- ⚠️ Sin pipeline de deploy automatizado/test en CI.
- 🔁 **Re-evaluar antes de producción multi-contribuidor:** añadir GitHub Actions (lint + type-check + test E2E en PR) cuando el equipo crezca.

---

## ADR-005 — Modelo de seguridad RLS-first

**Estado:** Aceptado (M0+, evolucionando)

**Contexto:** ¿Dónde imponer autorización? Opciones: capa de app (middleware/actions), o base de datos (RLS), o ambas.

**Decisión:** **RLS-first.** Toda tabla con datos de usuario tiene RLS con policies `auth.uid() = user_id`. Matriz pública/owner/service-role (ver `SECURITY_RLS_MODEL.md`). La app también valida (defensa en profundidad), pero RLS es el último muro.

**Consecuencias:**
- ✅ La anon key no puede eludir el control (no hay bypass desde el cliente). Defensa en profundidad real.
- ✅ Consistente sin importar desde dónde se acceda (action, API, RPC, dashboard).
- ⚠️ Complejidad de policies; fácil cometer errores (ej. TELO-003 expuso PII, TELO-010 aún abierto).
- ⚠️ **Disciplina del service-role crítica:** bypassa todo. TELO-001 ocurrió por guardar la service-role key legible públicamente → ahora en `app_secrets` (RLS bloqueado).
- ⚠️ Diferenciación `profiles` (phone, owner-only) vs vista `profiles_public` (pública) añade complejidad deliberada para proteger PII.

---

> **Convención para futuros ADRs:** numerar secuencialmente, mantener formato corto, marcar `Estado` (Propuesto / Aceptado / Reemplazado por ADR-NNN / Obsoleto). Actualizar al cambiar una decisión — no borrar.
