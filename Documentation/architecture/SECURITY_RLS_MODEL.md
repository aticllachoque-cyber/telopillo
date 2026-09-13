# Modelo de seguridad y RLS — Telopillo

Telopillo usa un modelo **RLS-first**: todo control de acceso se impone en PostgreSQL (Row Level Security), no sólo en la capa de aplicación. La anon key nunca puede eludirlo; sólo el service-role lo bypassa.

## Clientes Supabase y su relación con RLS

| Cliente (`lib/supabase/`) | Contexto | RLS | Notas |
|---------------------------|----------|-----|-------|
| `client.ts` (browser) | Cliente SPA | ✅ Sí | Respeta `auth.uid()` del JWT. |
| `server.ts` `createClient()` | Server Components / Server Actions / API authd | ✅ Sí | Cookies httpOnly vía `@supabase/ssr`. |
| `server.ts` `createPublicClient()` | Lecturas anónimas (búsqueda pública) | ✅ Sí | Sólo ve filas permitidas por policies públicas. |
| `admin.ts` `createAdminClient()` | Service-role | ❌ Bypass | **Sólo backend con justificación** (embeddings, jobs, migraciones de datos). Documentar uso. |

## Matriz RLS — tabla × operación × acceso

`🟢 = público`, `👤 = owner (auth.uid() = user_id)`, `🔧 = service-role`, `🔒 = bloqueado (sin policy pública)`.

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | 👤 propia + 🟢 vía vista `profiles_public` | 👤 (auto-creación trigger) | 👤 propia | 👤 propia |
| `business_profiles` | 🟢 pública | 👤 propia | 👤 propia | 👤 propia |
| `products` | 🟢 activos + 👤 propios | 👤 propia | 👤 propia | 👤 propia |
| `demand_posts` | 🟢 activos + 👤 propios | 👤 (auth requerido) | 👤 propia | 👤 propia |
| `demand_offers` | 🟢 activos + 👤 (owner del post) | 👤 (vendedor auth) | — | 👤 (creador) |
| `app_config` | 🟢 pública | — | 🔧 service-role | — |
| `app_secrets` | 🔒 | 🔒 | 🔒 | 🔒 (sólo service-role) |

> Lectura pública de `profiles` se hace a través de la **vista `profiles_public`** (sin `phone`), no de la tabla `profiles` directamente.

## Storage (buckets)

| Bucket | Lectura | Upload/Update/Delete |
|--------|---------|----------------------|
| `avatars` | 🟢 público | 👤 path `{userId}/*` |
| `product-images` | 🟢 público | 👤 `{userId}/*` |
| `demand-images` | 🟢 público | 👤 `{userId}/*` |
| `business-logos` | 🟢 público | 👤 `{userId}/*` |

Límites aplicados: 5MB (2MB avatars), MIME `image/jpeg|png|webp`, paths user-scoped `{userId}/{filename}`. Compresión client-side en `lib/utils/image.ts`.

## Límites de PII

- **`phone`** (`profiles`): sólo owner. Acceso externo controlado vía `get_seller_contact_phone()` RPC (no en SELECT directo). Fix TELO-003.
- **`nit`** (`business_profiles`): PII tributario sensible.
- **`service_role_key`**: ya NO vive en `app_config` (era legible públicamente). Migrada a `app_secrets` (RLS bloqueado). Fix TELO-001.

## Items abiertos (de `status/BUG_AUDIT_2026-05-29.md`)

Estos son gaps conocidos del modelo, no estado deseado:

- **TELO-004 (parcial):** algunas escrituras aún van client→Supabase en vez de server actions con `safeParse` (avatar, cambio de estado de producto, onboarding). Meta = migrar todas a server actions.
- **TELO-010:** `demand_offers` visible a anónimos (la policy pública de SELECT sobre offers activas expone datos que quizá debieran restringirse).
- **TELO-013:** pendiente (ver bug audit).

## Principios operativos

1. **Toda tabla con datos de usuario → RLS habilitado.** Sin excepciones.
2. **Validación server-side obligatoria:** Zod (`lib/validations/`) + `stripHtml()` (`lib/validations/sanitize.ts`). No confiar en validación client.
3. **Service-role = último recurso.** Comentar por qué. Nunca exponer al cliente.
4. **Rutas API públicas se documentan** como públicas con comentario (`/api/search`, `/api/search-demands`).
