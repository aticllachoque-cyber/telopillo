# Modelo de datos — Telopillo

Esquema de la base PostgreSQL (Supabase). Fuente de verdad: `supabase/migrations/` + `types/database.ts`.

## Visión general

8 tablas + 1 vista pública. Núcleo: `profiles` (usuario) centraliza identidad; todo cuelga de ahí.

```mermaid
erDiagram
    users["auth.users"] ||--|| profiles : "1:1 (profiles.id = auth.users.id)"
    profiles ||--o| business_profiles : "tiene (1:1, opcional)"
    profiles ||--o{ products : "publica (user_id)"
    profiles ||--o{ demand_posts : "busca (user_id)"
    demand_posts ||--o{ demand_offers : "recibe (demand_post_id)"
    products ||--o{ demand_offers : "se ofrece (product_id)"
    profiles ||--o{ demand_offers : "vende (seller_id)"

    profiles {
        uuid id PK
        text full_name
        text account_type
        text phone
        bool  phone_verified
        int   verification_level
        bool  is_verified
        text  location_department
        numeric rating_average
    }
    business_profiles {
        uuid id PK_FK "→ profiles.id"
        text business_name
        text slug UK
        text nit
        text social_whatsapp
    }
    products {
        uuid id PK
        uuid user_id FK "→ profiles.id"
        text title
        numeric price
        text  category
        text  status
        text[] images
        vector embedding
        tsvector search_vector
    }
    demand_posts {
        uuid id PK
        uuid user_id FK "→ profiles.id"
        text title
        text category
        numeric price_min
        numeric price_max
        text status
        int  offers_count
        vector embedding
        tsvector search_vector
        timestamptz expires_at
    }
    demand_offers {
        uuid id PK
        uuid demand_post_id FK
        uuid product_id FK
        uuid seller_id FK "→ profiles.id"
        text message
    }
```

## Tablas

### `profiles` — usuario (1:1 con `auth.users`)
Identidad del usuario. `id` = `auth.users.id` (mismo UUID). Columnas clave: `full_name`, `account_type` (`personal`/`business`), `phone` (PII), `phone_verified`, `verification_level`, `is_verified`, `location_city/department`, `rating_average/count`. RLS: phone sólo visible al owner.

### `business_profiles` — cuenta de negocio (1:1 opcional con `profiles`)
`id` = `profiles.id` (uno a uno). Datos comerciales: `business_name`, `slug` (único, URL pública `/negocio/[slug]`), `nit` (PII sensible), `business_logo_url`, redes sociales (`social_facebook/instagram/tiktok/whatsapp`), `business_hours` (JSON).

### `products` — listings
Lo que se vende. FK `user_id → profiles.id`. Búsqueda: `search_vector` (tsvector FTS) + `embedding` (vector 384d pgvector). Contadores: `views_count`, `favorites_count`, `contacts_count`. `status` (`active`/...), `expires_at`, `images[]` (Storage). `currency` (BOB).

### `demand_posts` — demanda "Busco" (M4.7)
Lo que un comprador busca. FK `user_id → profiles.id`. Estructura espejo a products para search: `search_vector` + `embedding`. Rango de precio `price_min/max`. `status` (`active`/`found`/`deleted`), `offers_count`, `expires_at`.

### `demand_offers` — oferta sobre una demanda (M4.7)
Tabla de unión **tres vías**: une `demand_posts` × `products` × `profiles` (vendedor). Un vendedor ofrece uno de sus productos a una demanda. `seller_id → profiles.id`, `product_id → products.id`, `demand_post_id → demand_posts.id`.

### `app_config` — configuración global (singleton)
`key`/`value`. **Lectura pública** (ej. `semantic_search_enabled`). Escritura sólo service-role.

### `app_secrets` — secretos en DB (M4.7 fix TELO-001)
`key`/`value`. RLS sin policies públicas → **sólo service-role**. Reemplazó el patrón anterior de guardar `service_role_key` en `app_config` legible públicamente.

### `profiles_public` (VISTA)
Proyección **pública y segura** de `profiles`: expone `full_name`, `avatar_url`, `location`, `rating_*`, `verification_level`, `account_type`, `phone_verified`, `onboarding_completed`. **NO expone `phone`** (fix TELO-003). Es lo que leen los clientes anónimos.

## Índices relevantes

- **FTS:** GIN sobre `search_vector` (products + demand_posts).
- **Vectorial:** HNSW sobre `embedding` con `vector_cosine_ops` (products + demand_posts).
- **FKs y consultas:** índices en `user_id`, `category`, `status`, `location_department`, `created_at`, `expires_at`, y listados compuestos `(status, category, location_department)`.

## Funciones RPC (PostgREST)

| Función | Uso |
|---------|-----|
| `search_products` | Búsqueda keyword (FTS) con filtros + paginación. |
| `search_products_semantic` | Búsqueda híbrida (FTS + vector + RRF interno). |
| `search_demands_hybrid` | Búsqueda híbrida de demandas. |
| `get_seller_contact_phone(p_user_id)` | Acceso controlado al teléfono del vendedor (no expone PII en SELECT directo). |
| `increment_product_views(product_id)` | Contador de vistas. |

Las RPC de búsqueda devuelven filas enriquecidas (join con `profiles` + `business_profiles` para info del vendedor). Ver tipos `SearchProduct` / `SearchDemandPost` en `types/database.ts`.
