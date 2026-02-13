# PRD — Telopillo.bo
## Marketplace de Compra y Venta para Bolivia

**Versión:** 1.4  
**Fecha:** 12 de febrero de 2026  
**Autor:** Alcides Cardenas  
**Estado:** Draft  
**Última actualización:** Fixed inconsistencies, added complete database schema, detailed categories, reputation system, geolocation, image handling, and content moderation policies

---

## 1. Visión del Producto

**Telopillo.bo** es un marketplace digital boliviano donde cualquier persona o negocio puede publicar productos para vender y buscar productos que necesita comprar. La plataforma conecta oferta y demanda de manera simple, rápida y con identidad local.

**Misión:** Democratizar el comercio digital en Bolivia, dando a vendedores individuales y negocios una plataforma accesible para llegar a más compradores, y a compradores una herramienta ágil para encontrar lo que buscan.

**Slogan:** *"Lo que buscás, ¡telopillo!"*

---

## 2. Problema

- En Bolivia, gran parte del comercio informal se realiza a través de grupos de Facebook, WhatsApp y ferias presenciales, sin estructura, sin búsqueda eficiente y sin garantías.
- Los compradores no tienen una forma centralizada de buscar productos y comparar opciones.
- Los vendedores (individuos y negocios pequeños) carecen de herramientas accesibles para publicar y gestionar sus productos de forma profesional.
- Las plataformas existentes (OLX, Marketplace de Facebook) no están optimizadas para el contexto boliviano ni ofrecen funcionalidades específicas para el mercado local.

---

## 3. Público Objetivo

### 3.1 Vendedores
- **Personas individuales (C2C):** Quieren vender productos nuevos o usados de forma rápida y sin complicaciones.
- **Negocios y tiendas (B2C):** Ferreterías, tiendas de ropa, electrónica, alimentos, etc. que buscan presencia digital sin invertir en un e-commerce propio.

### 3.2 Compradores
- **Usuarios generales:** Personas que buscan productos específicos al mejor precio, con la posibilidad de comparar ofertas y contactar vendedores directamente.

### 3.3 Demografía Inicial
- **Ubicación:** Bolivia, con foco inicial en Santa Cruz, La Paz y Cochabamba (eje troncal).
- **Edad:** 18-45 años.
- **Perfil digital:** Usuarios activos de smartphones y redes sociales, acostumbrados a comprar/vender por WhatsApp y Facebook.

---

## 4. Alcance Técnico

### 4.1 Plataforma
- **Backend API** (RESTful) como núcleo del sistema.
- **Frontend web responsive** (mobile-first) — sin app nativa en la fase inicial.
- Diseño pensado para conexiones móviles y dispositivos de gama media-baja, comunes en Bolivia.

### 4.2 Stack Tecnológico (Decisión Final - Optimizado para Costo Mínimo)

| Capa | Tecnología | Justificación | Costo Mensual |
|---|---|---|---|
| **Backend BaaS** | **Supabase** | PostgreSQL + API REST auto-generada + Auth + Storage + Realtime todo incluido | **$0** (free tier) |
| **Base de datos** | **PostgreSQL 15 + pgvector** | Incluido en Supabase, datos relacionales + búsqueda vectorial | **$0** |
| **Auth** | **Supabase Auth** | OAuth 2.0 (Google, Facebook), JWT, Magic Links, todo nativo | **$0** |
| **Storage** | **Supabase Storage** | 1GB gratis, S3-compatible, CDN incluido, image transformations | **$0** |
| **Realtime/Chat** | **Supabase Realtime** | WebSockets nativos, pub/sub, database subscriptions | **$0** |
| **Búsqueda Keyword** | **PostgreSQL Full-Text Search** | Nativo en Postgres, excelente para español, trigram similarity | **$0** |
| **Búsqueda Semántica** | **FastAPI (Railway/Render)** | Solo para embeddings + búsqueda híbrida (10% del tráfico) | **$0** (free tier) |
| **Embeddings** | **Hugging Face Inference API** (MVP) → **FastAPI + Sentence Transformers** (Growth) | Fase 1: Serverless API gratuita. Fase 2: Self-hosted cuando superes rate limits | **$0** → **$7/mes** |
| **Modelo inicial** | `paraphrase-multilingual-MiniLM-L12-v2` | 118MB, 384 dims, optimizado para español. Solo genera vectores (no es LLM conversacional) | **$0** |
| **Frontend** | **Next.js 14+ (React)** | SSR para SEO, App Router, Tailwind CSS, TypeScript, Supabase SDK | **$0** |
| **Hosting Frontend** | **Vercel** | Edge Network global, 100GB bandwidth/mes gratis | **$0** |
| **Background Jobs** | **Supabase Edge Functions** | Deno runtime, 500K invocations/mes gratis, cron jobs incluidos | **$0** |
| **Email** | **Resend** | 3,000 emails/mes gratis, excelente deliverability | **$0** |
| **Monitoring** | **Supabase Dashboard** | Logs, métricas, SQL editor, todo incluido | **$0** |
| | | **COSTO TOTAL** | **$0/mes** |

**Capacidad del Free Tier (Realista):**
- **Database:** 500MB (~10,000-15,000 productos con metadata)
- **Storage:** 1GB (~1,500 productos con 2 imágenes de 300KB c/u)
- **Bandwidth:** 2GB/mes (~1,000-2,000 usuarios activos/mes viendo 10 productos c/u)
- **Edge Functions:** 500K invocations/mes (~16K productos nuevos/mes con embeddings)
- **API Requests:** Ilimitado

**Nota sobre Bandwidth:**
- Cada imagen: ~300KB (después de optimización)
- Usuario promedio: 10 productos vistos = 3MB
- 2GB bandwidth ÷ 3MB = ~666 usuarios/mes
- **Para 10K usuarios necesitas:** ~30GB bandwidth = Supabase Pro ($25/mes)

**Estrategia de Optimización:**
- Usar CDN externo (Cloudflare R2) para imágenes grandes
- Supabase solo para thumbnails pequeños (<50KB)
- Lazy loading de imágenes
- WebP format (50% menos peso que JPEG)

**Escalabilidad:** Cuando superes los límites del free tier, Supabase Pro cuesta $25/mes (vs $100+/mes con stack tradicional)

### 4.2.1 Aclaración Importante: ¿Qué son los "Embeddings"?

**⚠️ IMPORTANTE: Los embeddings NO son un LLM conversacional como ChatGPT**

Los embeddings son modelos pequeños (118MB) que solo convierten texto a vectores numéricos para búsqueda semántica.

```
┌─────────────────────────────────────────────────────────────┐
│  LLM Conversacional (NO lo usamos)                         │
│  ❌ ChatGPT, Claude, Llama                                  │
│  ❌ Varios GB de tamaño                                     │
│  ❌ Para chat, generación de texto                          │
│  ❌ Costoso de correr                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Modelo de Embeddings (SÍ lo usamos)                       │
│  ✅ sentence-transformers                                   │
│  ✅ Solo 118MB de tamaño                                    │
│  ✅ Convierte texto → vector de números                     │
│  ✅ Se ejecuta solo cuando:                                 │
│     - Publicas un producto (1 vez)                          │
│     - Haces una búsqueda (cada búsqueda)                    │
└─────────────────────────────────────────────────────────────┘
```

**Ejemplo de cómo funciona:**

```
Input:  "Vendo iPhone 13 Pro usado en buen estado"
        ↓
Modelo: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
        ↓
Output: [0.234, -0.456, 0.678, 0.123, ..., -0.089]  # 384 números
```

**Opciones de implementación por fase:**

| Fase | Solución | Dónde corre | Costo | Cuándo usar |
|------|----------|-------------|-------|-------------|
| **MVP** | Hugging Face API | Serverless (Edge Function) | $0 | 0-30K requests/mes |
| **Growth** | FastAPI + Sentence Transformers | Render ($7/mes) | $7/mes | >30K requests/mes |
| **Scale** | FastAPI optimizado | Render Standard ($25/mes) | $25/mes | >100K requests/mes |

**Para MVP (primeros 3-6 meses):**
- ✅ Usa Hugging Face Inference API (100% serverless)
- ✅ Corre en Supabase Edge Functions (Deno)
- ✅ NO necesitas instalar ni correr nada localmente
- ✅ NO necesitas FastAPI ni Railway
- ✅ Gratis hasta 30K requests/mes

### 4.2.2 Justificación: ¿Por qué Supabase + Embeddings Serverless?

**Decisión clave:** Supabase maneja el 90% del backend (CRUD, Auth, Storage, Chat) de forma gratuita, mientras los embeddings se generan serverless con Hugging Face API.

#### Ventajas de Supabase:
```
✅ PostgreSQL + pgvector incluido       # Búsqueda vectorial nativa
✅ PostgREST API auto-generada          # CRUD sin código
✅ Supabase Auth (OAuth, JWT, Magic Links)  # Auth completo
✅ Supabase Storage (1GB + CDN)         # Imágenes con transformations
✅ Supabase Realtime (WebSockets)       # Chat en tiempo real
✅ Row Level Security (RLS)             # Seguridad a nivel de DB
✅ Edge Functions (Deno)                # Background jobs + cron
✅ Dashboard completo                   # SQL editor, logs, métricas
✅ Free tier generoso                   # $0/mes hasta 10K usuarios
```

#### Ventajas de FastAPI (Solo para Búsqueda):
```python
✅ sentence-transformers    # Embeddings de texto
✅ transformers (Hugging Face)  # Modelos pre-entrenados
✅ numpy, scipy             # Operaciones vectoriales rápidas
✅ scikit-learn             # Similitud coseno, clustering
✅ Async/Await nativo       # Performance
```

#### Arquitectura Híbrida:
```
Frontend (Next.js + Supabase SDK)
    │
    ├─→ Supabase (90% del tráfico)
    │   ├─ CRUD productos (PostgREST)
    │   ├─ Auth (login, register, OAuth)
    │   ├─ Storage (upload/download imágenes)
    │   ├─ Chat (Realtime subscriptions)
    │   └─ PostgreSQL Full-Text Search (keyword)
    │
    └─→ FastAPI (10% del tráfico) [OPCIONAL - Solo Fase 2+]
        └─ Búsqueda semántica (embeddings + pgvector)
            └─ Conecta a Supabase PostgreSQL
```

**IMPORTANTE: Aclaración sobre Embeddings**

Los "embeddings" NO son un LLM conversacional como ChatGPT. Son modelos pequeños que solo convierten texto a vectores numéricos.

**¿Qué es un embedding?**
```
Texto: "Vendo iPhone 13 Pro usado"
       ↓ (modelo de embeddings)
Vector: [0.23, -0.45, 0.67, ..., 0.12]  # 384 números
```

**¿Cuándo se ejecuta?**
- Al publicar un producto (1 vez)
- Al hacer una búsqueda (cada búsqueda)

**Opciones de implementación:**

| Fase | Solución | Cómo funciona | Costo |
|------|----------|---------------|-------|
| **MVP** | Hugging Face Inference API | Serverless, sin instalar nada | $0 (30K requests/mes) |
| **Growth** | FastAPI en Railway/Render | Servidor que carga modelo en RAM (118MB) | $7/mes |
| **Scale** | FastAPI optimizado | Servidor dedicado con cache | $25/mes |

**Para MVP (recomendado):**
- Usa Hugging Face API (100% serverless)
- Corre en Supabase Edge Functions
- No necesitas FastAPI ni correr nada localmente
- Gratis hasta 30K requests/mes (~10K usuarios)

#### Ventajas de Costo:
- **$0/mes hasta 10K usuarios activos:** Supabase free tier + Hugging Face API gratis
- **Sin vendor lock-in:** Supabase es open-source, puedes self-host si creces
- **No API costs (MVP):** Hugging Face Inference API es gratis (rate-limited)
- **Escalabilidad gradual:** Supabase Pro ($25/mes) vs stack tradicional ($100+/mes)

#### Ejemplo de Implementación MVP (Supabase Edge Function + Hugging Face API):

**Opción 1: 100% Serverless (Recomendado para MVP)**

```typescript
// supabase/functions/generate-embedding/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const { productId, text } = await req.json()
  
  // 1. Llamar a Hugging Face Inference API (GRATIS)
  const response = await fetch(
    'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('HUGGINGFACE_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: text })
    }
  )
  
  const embedding = await response.json() // Vector de 384 números
  
  // 2. Guardar embedding en Supabase PostgreSQL
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  await supabase
    .from('products')
    .update({ embedding })
    .eq('id', productId)
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Trigger automático al crear producto:**
```sql
-- Genera embedding automáticamente cuando se crea un producto
CREATE OR REPLACE FUNCTION trigger_generate_embedding()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/generate-embedding',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'productId', NEW.id,
      'text', NEW.title || ' ' || NEW.description || ' ' || NEW.category
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_product_created
AFTER INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION trigger_generate_embedding();
```

**Ventajas de esta opción:**
- ✅ $0/mes (100% gratis)
- ✅ Cero servidores que mantener
- ✅ No necesitas FastAPI
- ✅ No necesitas Railway/Render
- ✅ Escalable hasta ~30K productos/mes

**Limitaciones:**
- ⚠️ Rate limit: ~30,000 requests/mes (suficiente para MVP)
- ⚠️ Latencia: ~500ms-1s por embedding

---

#### Ejemplo de Implementación Growth (FastAPI - Solo cuando superes rate limits):

**Opción 2: FastAPI Self-Hosted (Solo Fase 2+)**
```python
# search-service/main.py
from fastapi import FastAPI, Query
from sentence_transformers import SentenceTransformer
from supabase import create_client
import numpy as np

app = FastAPI()
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

@app.get("/api/search/hybrid")
async def hybrid_search(
    q: str = Query(..., min_length=2, max_length=100),
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    location: Optional[str] = None,
    limit: int = 20
):
    # 1. Búsqueda keyword (PostgreSQL Full-Text Search) - paralelo
    keyword_task = asyncio.create_task(
        keyword_search_supabase(q, filters={...})
    )
    
    # 2. Búsqueda semántica (pgvector) - paralelo
    query_embedding = model.encode(q)
    semantic_task = asyncio.create_task(
        vector_search_supabase(query_embedding, filters={...})
    )
    
    # 3. Esperar ambos resultados
    keyword_results, semantic_results = await asyncio.gather(
        keyword_task, semantic_task
    )
    
    # 4. Fusión híbrida (RRF - Reciprocal Rank Fusion)
    merged = reciprocal_rank_fusion(
        keyword_results, 
        semantic_results,
        k=60
    )
    
    return {
        "results": merged[:limit],
        "total": len(merged),
        "query": q
    }

async def keyword_search_supabase(query: str, filters: dict):
    """PostgreSQL Full-Text Search with Spanish configuration"""
    response = await supabase.rpc(
        'search_products_keyword',
        {
            'search_query': query,
            'category_filter': filters.get('category'),
            'min_price': filters.get('min_price'),
            'max_price': filters.get('max_price')
        }
    ).execute()
    return response.data

async def vector_search_supabase(embedding: np.ndarray, filters: dict):
    """pgvector similarity search"""
    response = await supabase.rpc(
        'search_products_semantic',
        {
            'query_embedding': embedding.tolist(),
            'match_threshold': 0.7,
            'match_count': 50
        }
    ).execute()
    return response.data
```

#### Ejemplo de PostgreSQL Functions (Supabase):
```sql
-- Full-Text Search function
CREATE OR REPLACE FUNCTION search_products_keyword(
    search_query TEXT,
    category_filter TEXT DEFAULT NULL,
    min_price NUMERIC DEFAULT NULL,
    max_price NUMERIC DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    price NUMERIC,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.price,
        ts_rank(
            to_tsvector('spanish', p.title || ' ' || p.description),
            plainto_tsquery('spanish', search_query)
        ) as rank
    FROM products p
    WHERE 
        to_tsvector('spanish', p.title || ' ' || p.description) 
        @@ plainto_tsquery('spanish', search_query)
        AND (category_filter IS NULL OR p.category = category_filter)
        AND (min_price IS NULL OR p.price >= min_price)
        AND (max_price IS NULL OR p.price <= max_price)
    ORDER BY rank DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Vector similarity search function
CREATE OR REPLACE FUNCTION search_products_semantic(
    query_embedding VECTOR(384),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    price NUMERIC,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.price,
        1 - (p.embedding <=> query_embedding) as similarity
    FROM products p
    WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

### 4.2.2 Arquitectura de Sistema (Supabase + FastAPI Híbrido)

```
┌──────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js + Supabase SDK)           │
│                    Vercel (Edge Network)                 │
└────────────┬────────────────────────────┬────────────────┘
             │                            │
             │ 90% tráfico                │ 10% tráfico
             │ (CRUD, Auth, Storage)      │ (Búsqueda semántica)
             │                            │
             ▼                            ▼
┌────────────────────────────┐  ┌──────────────────────────┐
│     SUPABASE (BaaS)        │  │  FastAPI (Railway/Render)│
│                            │  │                          │
│  ┌──────────────────────┐  │  │  /api/search/hybrid     │
│  │  PostgREST API       │  │  │  - Embeddings           │
│  │  (Auto-generado)     │  │  │  - Vector search        │
│  │                      │  │  │  - RRF fusion           │
│  │  GET /products       │  │  └──────────┬───────────────┘
│  │  POST /products      │  │             │
│  │  GET /products/:id   │  │             │ Read pgvector
│  │  PATCH /products/:id │  │             │
│  └──────────────────────┘  │             │
│                            │             │
│  ┌──────────────────────┐  │             │
│  │  Supabase Auth       │  │             │
│  │  - Google OAuth      │  │             │
│  │  - Facebook OAuth    │  │             │
│  │  - Email/Password    │  │             │
│  │  - Magic Links       │  │             │
│  │  - JWT automático    │  │             │
│  └──────────────────────┘  │             │
│                            │             │
│  ┌──────────────────────┐  │             │
│  │  Supabase Storage    │  │             │
│  │  - 1GB gratis        │  │             │
│  │  - CDN incluido      │  │             │
│  │  - Image transform   │  │             │
│  └──────────────────────┘  │             │
│                            │             │
│  ┌──────────────────────┐  │             │
│  │  Supabase Realtime   │  │             │
│  │  - WebSockets        │  │             │
│  │  - Chat pub/sub      │  │             │
│  │  - DB subscriptions  │  │             │
│  └──────────────────────┘  │             │
│                            │             │
│  ┌──────────────────────┐  │             │
│  │  Edge Functions      │  │             │
│  │  - Generate embeddings│ │             │
│  │  - Send emails       │  │             │
│  │  - Process images    │  │             │
│  │  - Cron jobs         │  │             │
│  └──────────────────────┘  │             │
│             │              │             │
│             ▼              │             │
│  ┌──────────────────────┐  │             │
│  │  PostgreSQL 15       │◄─┼─────────────┘
│  │  + pgvector          │  │
│  │  + Full-Text Search  │  │
│  │                      │  │
│  │  - 500MB database    │  │
│  │  - HNSW index        │  │
│  │  - Spanish config    │  │
│  └──────────────────────┘  │
└────────────────────────────┘

COSTO TOTAL: $0/mes (free tier)
```

### 4.2.3 Flujo de Datos: Publicar Producto (Con Supabase)

```
1. Usuario crea publicación (frontend Next.js)
   ↓
2. Upload imágenes → Supabase Storage (CDN automático)
   ↓
3. POST /rest/v1/products (Supabase PostgREST)
   - Título, descripción, precio, categoría, ubicación
   - URLs de imágenes desde Storage
   ↓
4. PostgreSQL guarda producto (sin embedding todavía)
   ↓
5. Database Trigger → Invoke Edge Function
   ↓
6. Edge Function (Deno) ejecuta:
   - Llama a FastAPI: POST /api/embeddings/generate
   - FastAPI genera embedding:
     text = f"{title} {description} {category}"
     embedding = model.encode(text)  # Vector 384 dims
   - Retorna embedding a Edge Function
   ↓
7. Edge Function actualiza producto:
   UPDATE products SET embedding = [...] WHERE id = product_id
   ↓
8. Producto listo para búsqueda:
   - Keyword: PostgreSQL Full-Text Search (to_tsvector)
   - Semántica: pgvector similarity (embedding <=> query_embedding)
```

**Alternativa (Sin FastAPI para MVP):**
```
1-4. Igual que arriba
   ↓
5. Edge Function llama a Hugging Face Inference API (gratis, rate-limited)
   - POST https://api-inference.huggingface.co/models/sentence-transformers/...
   - Retorna embedding
   ↓
6. Edge Function guarda embedding en PostgreSQL
   ↓
7. Producto listo para búsqueda
```

### 4.2.4 Comparación de Costos: Stack Tradicional vs Supabase

| Componente | Stack Tradicional | Costo/Mes | Stack Supabase | Costo/Mes |
|---|---|---|---|---|
| **Database** | PostgreSQL Managed (DigitalOcean) | $15 | Supabase PostgreSQL | **$0** |
| **Backend API** | FastAPI en Droplet 2GB | $18 | Supabase PostgREST | **$0** |
| **Auth** | Implementar manualmente | $0 (tiempo dev) | Supabase Auth | **$0** |
| **Storage** | AWS S3 + CloudFront | $10-20 | Supabase Storage | **$0** |
| **Cache** | Redis Cloud | $10 | (No necesario inicialmente) | **$0** |
| **Búsqueda Keyword** | Meilisearch Cloud | $29 | PostgreSQL FTS | **$0** |
| **Realtime/Chat** | Socket.io + Redis | $10 | Supabase Realtime | **$0** |
| **Background Jobs** | Celery + Redis | $10 | Edge Functions | **$0** |
| **Búsqueda Semántica** | FastAPI (mismo Droplet) | $0 | FastAPI (Railway) | **$0** |
| **Frontend Hosting** | Vercel | $0 | Vercel | **$0** |
| **Monitoring** | Datadog/New Relic | $15-30 | Supabase Dashboard | **$0** |
| **Email** | SendGrid | $15 | Resend | **$0** |
| **TOTAL** | | **$132-157/mes** | | **$0/mes** |

**Capacidad del Free Tier de Supabase:**
- ✅ 500MB database → ~50,000 productos
- ✅ 1GB storage → ~5,000 imágenes (200KB c/u)
- ✅ 2GB bandwidth/mes → ~10,000 usuarios activos/mes
- ✅ 500K edge function invocations/mes
- ✅ API requests ilimitados
- ✅ Auth users ilimitados

**Cuándo migrar a Supabase Pro ($25/mes):**
- Superas 500MB de database
- Superas 1GB de storage
- Superas 2GB de bandwidth/mes
- Necesitas más de 500K edge function invocations/mes
- Requieres soporte prioritario

**Ahorro anual:**
- Stack tradicional: $1,584 - $1,884/año
- Stack Supabase: $0/año (fase inicial) → $300/año (Pro)
- **Ahorro: $1,284 - $1,584/año**

### 4.2.5 Plan de Escalamiento por Fases

#### Fase 1: MVP (0-1,000 usuarios, Mes 1-3)
```
Stack: 100% Supabase Free Tier + Hugging Face API
Costo: $0/mes

Componentes:
- Supabase: Database, Auth, Storage, Realtime, Edge Functions
- Hugging Face API: Embeddings (30K requests/mes gratis)
- Vercel: Frontend Next.js
- Resend: Emails (3K/mes gratis)

Ventajas:
- 100% serverless, cero mantenimiento
- No necesitas FastAPI ni Railway
- Perfecto para validar MVP

Limitaciones:
- Hugging Face API: rate limit de 30K requests/mes
- Latencia de embeddings: ~500ms-1s (aceptable para MVP)

Capacidad:
- ~1,000 productos nuevos/mes
- ~10,000 búsquedas/mes
- Suficiente para primeros 3-6 meses
```

#### Fase 2: Growth (1K-10K usuarios, Mes 4-12)
```
Stack: Supabase Free Tier + FastAPI en Render
Costo: $7/mes

Cuándo migrar:
- Superas 30K requests/mes en Hugging Face API
- Necesitas latencia más baja (<100ms para embeddings)
- Tienes >3,000 productos nuevos/mes

Cambios:
- Agregar FastAPI en Render Starter ($7/mes)
  - 512MB RAM, uptime 24/7
  - Modelo sentence-transformers en memoria (118MB)
  - Latencia: ~50-100ms (10x más rápido que HF API)
- Mantener Supabase free tier
- Agregar Cloudflare R2 si storage de Supabase se llena

Capacidad:
- ~10K usuarios activos/mes
- ~50K productos
- ~5K imágenes
- Embeddings ilimitados (sin rate limits)
```

#### Fase 3: Scale (10K-50K usuarios, Año 2)
```
Stack: Supabase Pro + Render Standard
Costo: $25 (Supabase) + $25 (Render) = $50/mes

Cambios:
- Supabase Pro: 8GB database, 100GB storage, 50GB bandwidth
- Render Standard: 2GB RAM, mejor performance
- Considerar CDN adicional (Cloudflare) para imágenes

Capacidad:
- ~50K usuarios activos/mes
- ~500K productos
- ~50K imágenes
```

#### Fase 4: Enterprise (50K+ usuarios, Año 3+)
```
Stack: Supabase Pro + Dedicated Infra
Costo: $100-300/mes

Opciones:
A) Supabase Pro + Render Pro ($85/mes)
B) Self-host Supabase + Hetzner VPS ($50/mes)
C) Supabase Enterprise (custom pricing)

Optimizaciones:
- Sharding de database por región (Santa Cruz, La Paz, Cochabamba)
- CDN multi-región
- Read replicas para búsqueda
- Cache distribuido (Redis)
```

### 4.3 Arquitectura de Búsqueda Semántica

**Enfoque Híbrido: Keyword + Semantic Search**

La búsqueda será el diferenciador principal de Telopillo.bo. Implementaremos un sistema híbrido que combine:

1. **Búsqueda por Keywords (PostgreSQL Full-Text Search):**
   - Para coincidencias exactas y filtros estructurados
   - Rápida y eficiente para consultas específicas
   - Configuración en español con stemming nativo
   - Trigram similarity para typo tolerance

2. **Búsqueda Semántica (pgvector):**
   - Comprende la intención del usuario, no solo palabras clave
   - Encuentra productos similares aunque usen términos diferentes
   - Ejemplo: buscar "celular" también encuentra "smartphone", "teléfono móvil", "iPhone"
   - Basada en embeddings vectoriales de texto (384 dimensiones)

3. **Estrategia de Implementación:**
   ```
   Query del usuario → Procesamiento paralelo:
   ├─ Path 1: PostgreSQL Full-Text Search (to_tsvector + plainto_tsquery)
   ├─ Path 2: Embedding del query → pgvector similarity (<=> operator)
   └─ Fusión de resultados con ranking híbrido (RRF - Reciprocal Rank Fusion)
   ```

4. **Casos de Uso Específicos para Bolivia:**
   - **Sinónimos locales:** "chompa" = "buzo" = "sudadera"
   - **Variaciones regionales:** "auto" = "carro" = "vehículo"
   - **Errores tipográficos:** "samsumg" → "samsung" (trigram similarity)
   - **Búsquedas coloquiales:** "tele grande para ver fútbol" → TVs 50"+ con buena resolución
   - **Descripciones vagas:** "algo para hacer ejercicio en casa" → pesas, colchonetas, bicicletas estáticas

5. **Modelos de Embeddings:**
   - **Fase MVP:** `paraphrase-multilingual-MiniLM-L12-v2` (118MB, 384 dims, rápido)
   - **Fase Growth:** `paraphrase-multilingual-mpnet-base-v2` (420MB, 768 dims, mejor calidad)
   - **Fase Scale:** Fine-tuning con datos reales de búsquedas bolivianas
   - **Alternativa sin FastAPI:** Hugging Face Inference API (gratis, rate-limited)

### 4.4 Implementación de Chat en Tiempo Real (Supabase Realtime)

**Ventaja clave:** Supabase Realtime elimina la necesidad de implementar WebSockets custom, Socket.io, o Redis pub/sub.

#### 4.4.1 Schema de Base de Datos para Chat

```sql
-- Conversaciones entre comprador y vendedor
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, buyer_id, seller_id)
);

-- Mensajes dentro de una conversación
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON conversations(seller_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
ON conversations FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Policy: Users can only see messages from their conversations
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (
    conversation_id IN (
        SELECT id FROM conversations 
        WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
);

-- Policy: Users can only send messages to their conversations
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
    conversation_id IN (
        SELECT id FROM conversations 
        WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
);
```

#### 4.4.2 Implementación Frontend (Next.js + Supabase SDK)

```typescript
// app/chat/[conversationId]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ChatPage({ params }: { params: { conversationId: string } }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    // 1. Cargar mensajes existentes
    loadMessages()

    // 2. Suscribirse a nuevos mensajes en tiempo real
    const channel = supabase
      .channel(`conversation:${params.conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${params.conversationId}`
        },
        (payload) => {
          console.log('Nuevo mensaje:', payload.new)
          setMessages((prev) => [...prev, payload.new as Message])
          
          // Scroll to bottom
          scrollToBottom()
        }
      )
      .subscribe()

    // Cleanup: Desuscribirse al desmontar
    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.conversationId])

  async function loadMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:auth.users(id, email, full_name)')
      .eq('conversation_id', params.conversationId)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
  }

  async function sendMessage() {
    if (!newMessage.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: params.conversationId,
        sender_id: user.id,
        content: newMessage.trim()
      })

    if (!error) {
      setNewMessage('')
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Chat</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.sender_id === user?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p>{msg.content}</p>
              <span className="text-xs opacity-70">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            onClick={sendMessage}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
```

#### 4.4.3 Ventajas de Supabase Realtime vs Socket.io

| Aspecto | Socket.io + Redis | Supabase Realtime |
|---------|-------------------|-------------------|
| **Configuración** | Compleja (servidor WebSocket, Redis pub/sub) | Cero configuración |
| **Costo** | Redis Cloud ($10/mes) | Incluido gratis |
| **Escalabilidad** | Manual (sticky sessions, Redis adapter) | Automática |
| **Autenticación** | Implementar manualmente | JWT integrado |
| **Autorización** | Implementar en código | Row Level Security (RLS) |
| **Persistencia** | Separada (guardar en DB manualmente) | Automática (DB triggers) |
| **Reconexión** | Implementar manualmente | Automática |
| **Typing indicators** | Implementar con eventos custom | Usar Presence API |
| **Read receipts** | Implementar manualmente | Update + subscription |

#### 4.4.4 Features Adicionales con Supabase Realtime

**1. Presence (Usuarios en línea):**
```typescript
// Ver quién está en línea en una conversación
const channel = supabase.channel(`conversation:${conversationId}`)

// Trackear presencia del usuario actual
channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    console.log('Usuarios en línea:', Object.keys(state))
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user_id: user.id, online_at: new Date().toISOString() })
    }
  })
```

**2. Typing Indicators:**
```typescript
// Enviar "está escribiendo..."
function handleTyping() {
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { user_id: user.id }
  })
}

// Recibir "está escribiendo..."
channel.on('broadcast', { event: 'typing' }, (payload) => {
  console.log(`${payload.user_id} está escribiendo...`)
  setIsTyping(true)
  
  // Clear after 3 seconds
  setTimeout(() => setIsTyping(false), 3000)
})
```

**3. Read Receipts:**
```typescript
// Marcar mensajes como leídos
async function markAsRead(messageId: string) {
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('id', messageId)
}

// Escuchar cambios en read status
channel.on(
  'postgres_changes',
  {
    event: 'UPDATE',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  },
  (payload) => {
    if (payload.new.read) {
      console.log('Mensaje leído:', payload.new.id)
    }
  }
)
```

#### 4.4.5 Notificaciones Push (Opcional - Fase 2)

```typescript
// Edge Function: Enviar notificación cuando llega mensaje nuevo
// supabase/functions/notify-new-message/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const { record } = await req.json() // Message record from trigger
  
  const supabase = createClient(...)
  
  // Get recipient info
  const { data: conversation } = await supabase
    .from('conversations')
    .select('buyer_id, seller_id')
    .eq('id', record.conversation_id)
    .single()
  
  const recipientId = record.sender_id === conversation.buyer_id 
    ? conversation.seller_id 
    : conversation.buyer_id
  
  // Send email notification (via Resend)
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Telopillo <noreply@telopillo.bo>',
      to: recipientEmail,
      subject: 'Nuevo mensaje en Telopillo',
      html: `<p>Tienes un nuevo mensaje: "${record.content}"</p>`
    })
  })
  
  return new Response('OK')
})

// Database trigger para invocar Edge Function
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/notify-new-message',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object('record', NEW)::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_created
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();
```

### 4.5 Database Schema (PostgreSQL + Supabase)

#### 4.5.1 Core Tables

**profiles (extends auth.users)**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  location_city TEXT,
  location_department TEXT, -- Santa Cruz, La Paz, Cochabamba, etc.
  location_coordinates GEOGRAPHY(POINT, 4326), -- PostGIS for geolocation
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMPTZ,
  rating_average DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 5.00
  rating_count INTEGER DEFAULT 0,
  products_sold_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_location_city ON profiles(location_city);
CREATE INDEX idx_profiles_location_department ON profiles(location_department);
CREATE INDEX idx_profiles_location_coordinates ON profiles USING GIST(location_coordinates);
CREATE INDEX idx_profiles_rating ON profiles(rating_average DESC);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

**products**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- See categories section
  subcategory TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BOB', -- Bolivianos
  condition TEXT NOT NULL, -- 'new', 'used_like_new', 'used_good', 'used_fair'
  location_city TEXT NOT NULL,
  location_department TEXT NOT NULL,
  location_coordinates GEOGRAPHY(POINT, 4326),
  images TEXT[] NOT NULL, -- Array of image URLs
  status TEXT DEFAULT 'active', -- 'active', 'sold', 'inactive', 'deleted'
  views_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  contacts_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE, -- Premium feature
  featured_until TIMESTAMPTZ,
  embedding VECTOR(384), -- For semantic search
  search_vector TSVECTOR, -- For full-text search
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days'
);

-- Indexes
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_location_city ON products(location_city);
CREATE INDEX idx_products_location_coordinates ON products USING GIST(location_coordinates);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_is_featured ON products(is_featured) WHERE is_featured = TRUE;

-- Full-Text Search Index (Spanish)
CREATE INDEX idx_products_search_vector ON products USING GIN(search_vector);

-- Vector Search Index (HNSW for fast similarity search)
CREATE INDEX idx_products_embedding ON products USING hnsw (embedding vector_cosine_ops);

-- Auto-update search_vector trigger
CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.category, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_vector_trigger
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION products_search_vector_update();

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
ON products FOR SELECT
USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can create own products"
ON products FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
ON products FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
ON products FOR DELETE
USING (auth.uid() = user_id);
```

**conversations**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  buyer_unread_count INTEGER DEFAULT 0,
  seller_unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, buyer_id, seller_id)
);

-- Indexes
CREATE INDEX idx_conversations_buyer ON conversations(buyer_id, last_message_at DESC);
CREATE INDEX idx_conversations_seller ON conversations(seller_id, last_message_at DESC);
CREATE INDEX idx_conversations_product ON conversations(product_id);

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
ON conversations FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() = buyer_id);
```

**messages**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = FALSE;

-- Auto-update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    buyer_unread_count = CASE 
      WHEN NEW.sender_id != buyer_id THEN buyer_unread_count + 1
      ELSE buyer_unread_count
    END,
    seller_unread_count = CASE 
      WHEN NEW.sender_id != seller_id THEN seller_unread_count + 1
      ELSE seller_unread_count
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_update_conversation
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- RLS Policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from own conversations"
ON messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to own conversations"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
  )
);
```

**ratings**
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, from_user_id, to_user_id)
);

-- Indexes
CREATE INDEX idx_ratings_to_user ON ratings(to_user_id);
CREATE INDEX idx_ratings_product ON ratings(product_id);

-- Auto-update user rating average
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    rating_average = (
      SELECT COALESCE(AVG(rating), 0)
      FROM ratings
      WHERE to_user_id = NEW.to_user_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM ratings
      WHERE to_user_id = NEW.to_user_id
    )
  WHERE id = NEW.to_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ratings_update_user
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating();

-- RLS Policies
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings are viewable by everyone"
ON ratings FOR SELECT
USING (true);

CREATE POLICY "Users can create ratings"
ON ratings FOR INSERT
WITH CHECK (auth.uid() = from_user_id);
```

**favorites**
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Indexes
CREATE INDEX idx_favorites_user ON favorites(user_id, created_at DESC);
CREATE INDEX idx_favorites_product ON favorites(product_id);

-- Auto-update product favorites_count
CREATE OR REPLACE FUNCTION update_product_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products
    SET favorites_count = favorites_count + 1
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products
    SET favorites_count = favorites_count - 1
    WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER favorites_update_count
AFTER INSERT OR DELETE ON favorites
FOR EACH ROW
EXECUTE FUNCTION update_product_favorites_count();

-- RLS Policies
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
ON favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own favorites"
ON favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
ON favorites FOR DELETE
USING (auth.uid() = user_id);
```

**reports (content moderation)**
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_type TEXT NOT NULL, -- 'product', 'user', 'message'
  reported_id UUID NOT NULL,
  reason TEXT NOT NULL, -- 'spam', 'inappropriate', 'scam', 'other'
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved', 'dismissed'
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_reported ON reports(reported_type, reported_id);

-- RLS Policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
ON reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
ON reports FOR SELECT
USING (auth.uid() = reporter_id);
```

#### 4.5.2 Helper Functions for Search

**Keyword Search Function:**
```sql
CREATE OR REPLACE FUNCTION search_products_keyword(
  search_query TEXT,
  category_filter TEXT DEFAULT NULL,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL,
  location_filter TEXT DEFAULT NULL,
  max_distance_km NUMERIC DEFAULT NULL,
  user_location GEOGRAPHY DEFAULT NULL,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price NUMERIC,
  location_city TEXT,
  images TEXT[],
  rank REAL,
  distance_km NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.location_city,
    p.images,
    ts_rank(p.search_vector, plainto_tsquery('spanish', search_query)) as rank,
    CASE 
      WHEN user_location IS NOT NULL AND p.location_coordinates IS NOT NULL
      THEN ST_Distance(user_location, p.location_coordinates) / 1000
      ELSE NULL
    END as distance_km
  FROM products p
  WHERE 
    p.status = 'active'
    AND p.search_vector @@ plainto_tsquery('spanish', search_query)
    AND (category_filter IS NULL OR p.category = category_filter)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
    AND (location_filter IS NULL OR p.location_city = location_filter)
    AND (
      max_distance_km IS NULL 
      OR user_location IS NULL 
      OR p.location_coordinates IS NULL
      OR ST_DWithin(user_location, p.location_coordinates, max_distance_km * 1000)
    )
  ORDER BY rank DESC, p.created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
```

**Semantic Search Function:**
```sql
CREATE OR REPLACE FUNCTION search_products_semantic(
  query_embedding VECTOR(384),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 50,
  category_filter TEXT DEFAULT NULL,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price NUMERIC,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    1 - (p.embedding <=> query_embedding) as similarity
  FROM products p
  WHERE 
    p.status = 'active'
    AND p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
    AND (category_filter IS NULL OR p.category = category_filter)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Modelo de Negocio

### Fase 1 — Freemium
| Característica | Gratis | Premium |
|---|---|---|
| Publicar productos | ✅ (hasta 10/mes) | ✅ Ilimitado |
| Fotos por producto | 3 | 10 |
| Contacto con compradores | ✅ | ✅ |
| Producto destacado | ❌ | ✅ (aparece primero en búsquedas) |
| Estadísticas de vistas | Básicas | Avanzadas |
| Badge de vendedor verificado | ❌ | ✅ |
| Tienda personalizada (perfil) | Básico | Personalizable |

### Evolución Futura (post-lanzamiento)
- Comisión por transacción (cuando se integre pasarela de pago).
- Publicidad y productos patrocinados.
- Suscripciones para negocios con más herramientas.

---

## 6. Funcionalidades — MVP (Fase 1)

### 6.1 Gestión de Usuarios
- **Registro/Login:** Email + contraseña, Google OAuth, Facebook OAuth.
- **Perfiles:** Nombre, foto, ubicación (ciudad/departamento), teléfono (opcional), calificación.
- **Roles:** Comprador, Vendedor (un usuario puede ser ambos).
- **Verificación básica:** Email verificado, opcionalmente teléfono.

### 6.2 Publicación de Productos (Vendedor)
- Crear publicación con: título, descripción, precio (en BOB), categoría, subcategoría, fotos (hasta 3 en plan gratis), ubicación, estado (nuevo/usado), disponibilidad.
- Editar y eliminar publicaciones propias.
- Dashboard básico: mis publicaciones, estado (activo/vendido/pausado), vistas.

### 6.3 Búsqueda y Descubrimiento (Comprador) — **FEATURE PRINCIPAL**

#### 6.3.1 Buscador Inteligente con Semántica
- **Búsqueda por texto libre** con comprensión semántica:
  - Entiende sinónimos y variaciones locales bolivianas
  - Tolera errores tipográficos comunes
  - Interpreta búsquedas coloquiales ("tele grande", "celu barato")
  - Búsqueda en lenguaje natural ("necesito algo para mi bebé de 6 meses")
  
- **Autocompletado inteligente:**
  - Sugerencias basadas en búsquedas populares
  - Corrección automática de ortografía
  - Sugerencias de categorías relevantes

- **Resultados híbridos:**
  - Coincidencias exactas primero (keyword match)
  - Seguidas de resultados semánticamente similares
  - Score de relevancia visible (opcional para debugging)

#### 6.3.2 Filtros y Ordenamiento
- **Filtros:** Categoría, precio (rango), ubicación (departamento/ciudad), estado (nuevo/usado), fecha de publicación
- **Ordenar por:** 
  - Relevancia (default - combina keyword + semantic score)
  - Más reciente
  - Precio: menor a mayor / mayor a menor
  - Distancia (si el usuario comparte ubicación)
  - Más vistos

#### 6.3.3 Product Categories (Complete Taxonomy)

**Category Structure:** 2 levels (Category → Subcategory)

| Category | Subcategories | Icon |
|----------|---------------|------|
| **Electronics & Technology** | Smartphones, Laptops & Computers, Tablets, TVs & Audio, Cameras & Photography, Video Games & Consoles, Accessories, Smart Home | 📱 |
| **Vehicles & Auto Parts** | Cars, Motorcycles, Bicycles, Auto Parts, Tires & Wheels, Accessories, Tools | 🚗 |
| **Home & Furniture** | Living Room, Bedroom, Kitchen, Bathroom, Garden & Outdoor, Appliances, Decoration | 🏠 |
| **Fashion & Accessories** | Men's Clothing, Women's Clothing, Kids' Clothing, Shoes, Bags & Backpacks, Jewelry & Watches, Sunglasses | 👕 |
| **Construction & Hardware** | Tools, Building Materials, Plumbing, Electrical, Paint & Supplies, Safety Equipment | 🔨 |
| **Sports & Outdoors** | Gym Equipment, Sports Gear, Camping & Hiking, Bicycles, Water Sports, Team Sports | ⚽ |
| **Baby & Kids** | Baby Clothing, Toys, Strollers & Car Seats, Furniture, Feeding, Diapers & Care | 👶 |
| **Beauty & Health** | Skincare, Makeup, Hair Care, Perfumes, Health Supplements, Medical Equipment | 💄 |
| **Books & Education** | Books, Textbooks, Courses, Musical Instruments, Art Supplies | 📚 |
| **Pets** | Pet Food, Accessories, Toys, Cages & Aquariums, Grooming | 🐶 |
| **Office & Business** | Office Furniture, Supplies, Printers & Scanners, Business Equipment | 💼 |
| **Food & Beverages** | Fresh Produce, Packaged Foods, Beverages, Snacks, Gourmet | 🍎 |
| **Services** | Repairs, Cleaning, Moving, Tutoring, Events, Professional Services | 🛠️ |
| **Other** | Collectibles, Antiques, Crafts, Miscellaneous | 📦 |

**Implementation:**
```sql
-- categories table (optional - can be hardcoded in frontend)
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT,
  order_index INTEGER,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE subcategories (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  order_index INTEGER,
  is_active BOOLEAN DEFAULT TRUE
);

-- Seed data example
INSERT INTO categories (id, name_es, name_en, icon, order_index) VALUES
('electronics', 'Electrónica y Tecnología', 'Electronics & Technology', '📱', 1),
('vehicles', 'Vehículos y Repuestos', 'Vehicles & Auto Parts', '🚗', 2),
('home', 'Hogar y Muebles', 'Home & Furniture', '🏠', 3),
('fashion', 'Moda y Accesorios', 'Fashion & Accessories', '👕', 4),
('construction', 'Construcción y Ferretería', 'Construction & Hardware', '🔨', 5),
('sports', 'Deportes y Aire Libre', 'Sports & Outdoors', '⚽', 6),
('baby', 'Bebés y Niños', 'Baby & Kids', '👶', 7),
('beauty', 'Belleza y Salud', 'Beauty & Health', '💄', 8),
('books', 'Libros y Educación', 'Books & Education', '📚', 9),
('pets', 'Mascotas', 'Pets', '🐶', 10),
('office', 'Oficina y Negocios', 'Office & Business', '💼', 11),
('food', 'Alimentos y Bebidas', 'Food & Beverages', '🍎', 12),
('services', 'Servicios', 'Services', '🛠️', 13),
('other', 'Otros', 'Other', '📦', 99);

INSERT INTO subcategories (id, category_id, name_es, name_en, order_index) VALUES
-- Electronics
('smartphones', 'electronics', 'Celulares y Smartphones', 'Smartphones', 1),
('laptops', 'electronics', 'Laptops y Computadoras', 'Laptops & Computers', 2),
('tablets', 'electronics', 'Tablets', 'Tablets', 3),
('tvs', 'electronics', 'TVs y Audio', 'TVs & Audio', 4),
('cameras', 'electronics', 'Cámaras y Fotografía', 'Cameras & Photography', 5),
('videogames', 'electronics', 'Videojuegos y Consolas', 'Video Games & Consoles', 6),
('tech-accessories', 'electronics', 'Accesorios', 'Accessories', 7),
-- Vehicles
('cars', 'vehicles', 'Autos', 'Cars', 1),
('motorcycles', 'vehicles', 'Motos', 'Motorcycles', 2),
('bicycles', 'vehicles', 'Bicicletas', 'Bicycles', 3),
('auto-parts', 'vehicles', 'Repuestos', 'Auto Parts', 4),
-- ... more subcategories
```

#### 6.3.4 Funcionalidades Adicionales
- **"Productos similares":** Basado en embeddings vectoriales del producto actual
- **"Búsquedas relacionadas":** Sugerencias semánticas al final de resultados
- **Feed principal** con productos recientes y destacados
- **Vista de producto individual** con galería de fotos, datos del vendedor y botón de contacto
- **Historial de búsquedas** (guardado localmente)

#### 6.3.5 Métricas de Búsqueda (para optimización continua)
- Click-through rate (CTR) por posición en resultados
- Tasa de refinamiento de búsqueda (cuántos usuarios modifican su query)
- Búsquedas sin resultados (para identificar gaps en el catálogo)
- Tiempo promedio hasta contactar vendedor después de búsqueda

### 6.4 Contacto y Comunicación
- **Botón "Contactar al vendedor"** que abre chat interno básico o redirige a WhatsApp (número del vendedor).
- Chat interno simple (mensajes de texto entre comprador y vendedor).
- Notificaciones (email y/o push web) cuando reciben un mensaje o interacción.

### 6.5 Reputation System (Detailed Rules)

#### 6.5.1 Who Can Rate Whom?

**Rules:**
- Only **buyers** can rate **sellers**
- Rating is tied to a specific product
- One rating per user per product (can't rate same seller twice for same product)
- Must have contacted the seller (conversation exists) to rate

**Why buyers only?**
- Prevents retaliation ratings
- Focuses on seller quality and trustworthiness
- Simpler for MVP (can add mutual ratings in Phase 2)

#### 6.5.2 When Can You Rate?

**Timing:**
- Anytime after first message is sent
- No time limit (can rate days/weeks later)
- Cannot rate if conversation was never started

**Rationale:**
- Flexible for users who forget to rate immediately
- Encourages honest feedback after transaction completes

#### 6.5.3 Rating Components

**Star Rating (Required):**
- 1-5 stars (integer)
- Mandatory field

**Comment (Optional):**
- Max 500 characters
- Optional but encouraged
- Can be left blank

**Rating Aspects (Future - Phase 2):**
- Communication (1-5)
- Product accuracy (1-5)
- Delivery/meetup (1-5)

#### 6.5.4 Rating Display

**On Seller Profile:**
```
⭐ 4.7 (23 ratings)

Recent Reviews:
⭐⭐⭐⭐⭐ "Excelente vendedor, producto como en las fotos"
  - Juan P. • iPhone 13 • hace 2 días

⭐⭐⭐⭐ "Buen producto, entrega rápida"
  - María G. • Laptop Dell • hace 1 semana
```

**On Product Card:**
```
Vendedor: Carlos M. ⭐ 4.7 (23)
```

**Rating Badges (Automatic):**
- 🌟 **New Seller** (0-5 ratings)
- ⭐ **Trusted Seller** (10+ ratings, avg ≥4.5)
- 💎 **Top Seller** (50+ ratings, avg ≥4.7)
- ⚠️ **Low Rating** (10+ ratings, avg <3.5)

#### 6.5.5 Rating Calculation

**Average Rating:**
```sql
rating_average = SUM(rating) / COUNT(rating)
```

**Weighted by Recency (Future - Phase 2):**
```sql
-- More recent ratings have higher weight
weight = 1.0 - (days_old / 365) * 0.3
weighted_average = SUM(rating * weight) / SUM(weight)
```

#### 6.5.6 Rating Moderation

**Can users edit/delete ratings?**
- **Edit:** Yes, within 7 days of posting
- **Delete:** No, but can be hidden by admins if inappropriate

**Reporting ratings:**
- Users can report fake/abusive ratings
- Admin reviews and can hide rating
- Repeated fake ratings → account suspension

**Preventing fake ratings:**
- Must have active conversation
- Rate limiting: Max 10 ratings per day per user
- Admin can flag suspicious patterns (same IP, rapid ratings)

#### 6.5.7 Implementation Example

**Frontend (Rating Form):**
```typescript
// components/ratings/RatingForm.tsx
interface RatingFormProps {
  productId: string
  sellerId: string
  onSuccess: () => void
}

export function RatingForm({ productId, sellerId, onSuccess }: RatingFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  
  async function handleSubmit() {
    const { error } = await supabase
      .from('ratings')
      .insert({
        product_id: productId,
        to_user_id: sellerId,
        from_user_id: user.id,
        rating,
        comment
      })
    
    if (!error) onSuccess()
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Cuéntanos sobre tu experiencia (opcional)"
        maxLength={500}
      />
      <button type="submit">Enviar Calificación</button>
    </form>
  )
}
```

**Backend (Validation):**
```sql
-- Check if user can rate (has conversation)
CREATE OR REPLACE FUNCTION can_user_rate_seller(
  p_user_id UUID,
  p_product_id UUID,
  p_seller_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.product_id = p_product_id
    AND c.buyer_id = p_user_id
    AND c.seller_id = p_seller_id
  );
END;
$$ LANGUAGE plpgsql;

-- Add check constraint
ALTER TABLE ratings
ADD CONSTRAINT ratings_must_have_conversation
CHECK (can_user_rate_seller(from_user_id, product_id, to_user_id));
```

### 6.6 Geolocation (Implementation Details)

#### 6.6.1 Location Data Structure

**Three-tier system:**
1. **Department** (Estado/Departamento) - Required
2. **City** (Ciudad) - Required
3. **Coordinates** (Lat/Long) - Optional

**Bolivia Departments:**
```typescript
const DEPARTMENTS = [
  'Santa Cruz',
  'La Paz',
  'Cochabamba',
  'Potosí',
  'Chuquisaca',
  'Oruro',
  'Tarija',
  'Beni',
  'Pando'
]
```

**Major Cities by Department:**
```typescript
const CITIES_BY_DEPARTMENT = {
  'Santa Cruz': ['Santa Cruz de la Sierra', 'Montero', 'Warnes', 'Camiri', 'Yacuiba'],
  'La Paz': ['La Paz', 'El Alto', 'Viacha', 'Achocalla', 'Copacabana'],
  'Cochabamba': ['Cochabamba', 'Quillacollo', 'Sacaba', 'Colcapirhua', 'Tiquipaya'],
  // ... more cities
}
```

#### 6.6.2 Location Capture Methods

**Option 1: Manual Selection (Default)**
```typescript
// User selects from dropdowns
<Select>
  <option>Santa Cruz</option>
  <option>La Paz</option>
  ...
</Select>

<Select>
  <option>Santa Cruz de la Sierra</option>
  <option>Montero</option>
  ...
</Select>
```

**Option 2: GPS Coordinates (Optional)**
```typescript
// Request browser geolocation
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords
    // Reverse geocode to get city/department
    reverseGeocode(latitude, longitude)
  },
  (error) => {
    // Fall back to manual selection
  }
)
```

**Option 3: IP Geolocation (Fallback)**
```typescript
// Use IP to guess approximate location
const response = await fetch('https://ipapi.co/json/')
const data = await response.json()
// Pre-fill department/city based on IP
```

#### 6.6.3 Location Display

**On Product Card:**
```
📍 Santa Cruz de la Sierra
```

**On Product Detail:**
```
📍 Santa Cruz de la Sierra, Santa Cruz
🗺️ Ver en mapa (if coordinates available)
```

**Privacy:**
- Never show exact coordinates publicly
- Show city-level location only
- Exact coordinates only used for distance calculation

#### 6.6.4 Distance-Based Search

**Search by Radius:**
```typescript
// Frontend
<Select>
  <option value="5">A 5 km</option>
  <option value="10">A 10 km</option>
  <option value="25">A 25 km</option>
  <option value="50">A 50 km</option>
  <option value="100">A 100 km</option>
</Select>
```

**Backend (PostGIS):**
```sql
-- Search products within radius
SELECT *
FROM products
WHERE ST_DWithin(
  location_coordinates,
  ST_MakePoint(-63.1821, -17.7833)::geography, -- User location
  10000 -- 10km in meters
)
ORDER BY location_coordinates <-> ST_MakePoint(-63.1821, -17.7833)::geography;
```

#### 6.6.5 Distance Calculation

**Display distance on results:**
```typescript
// Frontend
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  } else {
    return `${(meters / 1000).toFixed(1)}km`
  }
}

// Example: "2.5km de distancia"
```

**SQL Function:**
```sql
CREATE OR REPLACE FUNCTION calculate_distance(
  point1 GEOGRAPHY,
  point2 GEOGRAPHY
)
RETURNS NUMERIC AS $$
BEGIN
  RETURN ST_Distance(point1, point2) / 1000; -- Return km
END;
$$ LANGUAGE plpgsql;
```

#### 6.6.6 Map Integration (Phase 2)

**Option A: OpenStreetMap (Free)**
```typescript
import { MapContainer, TileLayer, Marker } from 'react-leaflet'

<MapContainer center={[-17.7833, -63.1821]} zoom={13}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  <Marker position={[-17.7833, -63.1821]} />
</MapContainer>
```

**Option B: Google Maps (Paid)**
```typescript
import { GoogleMap, Marker } from '@react-google-maps/api'

<GoogleMap
  center={{ lat: -17.7833, lng: -63.1821 }}
  zoom={13}
>
  <Marker position={{ lat: -17.7833, lng: -63.1821 }} />
</GoogleMap>
```

#### 6.6.7 Geolocation Filters

**Filter UI:**
```typescript
// Search filters
interface SearchFilters {
  department?: string
  city?: string
  maxDistance?: number // km
  userLocation?: { lat: number; lng: number }
}

// Example usage
const filters: SearchFilters = {
  department: 'Santa Cruz',
  city: 'Santa Cruz de la Sierra',
  maxDistance: 10,
  userLocation: { lat: -17.7833, lng: -63.1821 }
}
```

**Implementation Priority:**
- **MVP:** Department + City (manual selection)
- **Phase 2:** GPS coordinates + distance search
- **Phase 3:** Map view + radius drawing

### 6.6.7 Image Handling (Complete Specification)

#### 6.6.7.1 Image Requirements

**Limits per Product:**
- **Free users:** 3 images
- **Premium users:** 10 images
- **First image:** Becomes the main/cover image

**File Requirements:**
- **Formats:** JPEG, PNG, WebP
- **Max size per image:** 10MB (original upload)
- **Min dimensions:** 400x400px
- **Recommended:** 1200x1200px or higher

#### 6.6.7.2 Image Processing Pipeline

**Upload Flow:**
```
1. User selects images
   ↓
2. Frontend validation (size, format, dimensions)
   ↓
3. Upload to Supabase Storage (original)
   ↓
4. Trigger Edge Function: process-images
   ↓
5. Edge Function generates variants:
   - thumbnail: 200x200px (for cards)
   - medium: 800x800px (for gallery)
   - large: 1200x1200px (for lightbox)
   ↓
6. Save variant URLs to database
   ↓
7. Original can be deleted to save space (optional)
```

**Image Variants:**
| Variant | Size | Quality | Format | Use Case |
|---------|------|---------|--------|----------|
| **thumbnail** | 200x200px | 70% | WebP | Product cards, search results |
| **medium** | 800x800px | 80% | WebP | Product detail gallery |
| **large** | 1200x1200px | 85% | WebP | Lightbox/zoom view |
| **original** | As uploaded | 100% | Original | Backup (can be deleted) |

#### 6.6.7.3 Storage Structure

**Supabase Storage Buckets:**
```
products/
├── originals/
│   └── {product_id}/
│       ├── {uuid}_1.jpg
│       ├── {uuid}_2.jpg
│       └── {uuid}_3.jpg
├── thumbnails/
│   └── {product_id}/
│       ├── {uuid}_1.webp
│       ├── {uuid}_2.webp
│       └── {uuid}_3.webp
├── medium/
│   └── {product_id}/
│       ├── {uuid}_1.webp
│       ├── {uuid}_2.webp
│       └── {uuid}_3.webp
└── large/
    └── {product_id}/
        ├── {uuid}_1.webp
        ├── {uuid}_2.webp
        └── {uuid}_3.webp
```

#### 6.6.7.4 Image Processing Edge Function

```typescript
// supabase/functions/process-images/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { productId, imageUrls } = await req.json()
  
  const supabase = createClient(...)
  
  for (const imageUrl of imageUrls) {
    // 1. Download original
    const response = await fetch(imageUrl)
    const imageBuffer = await response.arrayBuffer()
    
    // 2. Generate variants using sharp (or similar)
    const variants = await generateVariants(imageBuffer, {
      thumbnail: { width: 200, height: 200, quality: 70 },
      medium: { width: 800, height: 800, quality: 80 },
      large: { width: 1200, height: 1200, quality: 85 }
    })
    
    // 3. Upload variants to storage
    for (const [size, buffer] of Object.entries(variants)) {
      await supabase.storage
        .from('products')
        .upload(`${size}/${productId}/${uuid}.webp`, buffer)
    }
  }
  
  return new Response('OK')
})
```

#### 6.6.7.5 Frontend Implementation

**Upload Component:**
```typescript
// components/products/ImageUpload.tsx
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ImageUpload({ productId, maxImages = 3 }) {
  const [images, setImages] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  
  async function handleUpload() {
    setUploading(true)
    const supabase = createClient()
    
    const uploadedUrls = []
    
    for (const file of images) {
      // 1. Validate
      if (file.size > 10 * 1024 * 1024) {
        alert('Image too large (max 10MB)')
        continue
      }
      
      // 2. Upload to Supabase Storage
      const fileName = `${crypto.randomUUID()}.${file.name.split('.').pop()}`
      const { data, error } = await supabase.storage
        .from('products')
        .upload(`originals/${productId}/${fileName}`, file)
      
      if (data) {
        const url = supabase.storage
          .from('products')
          .getPublicUrl(data.path).data.publicUrl
        
        uploadedUrls.push(url)
      }
    }
    
    // 3. Trigger processing
    await supabase.functions.invoke('process-images', {
      body: { productId, imageUrls: uploadedUrls }
    })
    
    setUploading(false)
  }
  
  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        max={maxImages}
        onChange={(e) => setImages(Array.from(e.target.files || []))}
      />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Images'}
      </button>
    </div>
  )
}
```

**Image Display:**
```typescript
// components/products/ProductImage.tsx
interface ProductImageProps {
  src: string
  alt: string
  size: 'thumbnail' | 'medium' | 'large'
}

export function ProductImage({ src, alt, size }: ProductImageProps) {
  // Replace original URL with variant URL
  const variantSrc = src.replace('/originals/', `/${size}/`)
                        .replace(/\.(jpg|jpeg|png)$/, '.webp')
  
  return (
    <img
      src={variantSrc}
      alt={alt}
      loading="lazy"
      className={size === 'thumbnail' ? 'w-48 h-48' : 'w-full'}
    />
  )
}
```

#### 6.6.7.6 Optimization Strategies

**Lazy Loading:**
```typescript
<img src={imageSrc} loading="lazy" />
```

**Responsive Images:**
```typescript
<picture>
  <source srcset={thumbnailSrc} media="(max-width: 640px)" />
  <source srcset={mediumSrc} media="(max-width: 1024px)" />
  <img src={largeSrc} alt={alt} />
</picture>
```

**Progressive Loading (Blur-up):**
```typescript
// 1. Show tiny blurred placeholder
<img src={tinyBlurredSrc} className="blur-lg" />

// 2. Load full image
<img 
  src={fullSrc} 
  onLoad={() => setLoaded(true)}
  className={loaded ? 'opacity-100' : 'opacity-0'}
/>
```

**CDN Strategy:**
- **MVP:** Supabase Storage CDN (included)
- **Phase 2:** Cloudflare R2 for large images
- **Phase 3:** Image CDN (Cloudinary/Imgix) for advanced transformations

#### 6.6.7.7 Storage Cost Optimization

**Estimated Storage:**
```
1 product with 3 images:
- Original: 3 × 2MB = 6MB
- Thumbnail: 3 × 20KB = 60KB
- Medium: 3 × 150KB = 450KB
- Large: 3 × 300KB = 900KB
Total: ~7.4MB per product

1,000 products = ~7.4GB
10,000 products = ~74GB
```

**Optimization:**
- Delete originals after processing (saves ~80% space)
- Use WebP format (50% smaller than JPEG)
- Aggressive compression on thumbnails
- Lazy delete old images when product is deleted

### 6.7 Content Moderation & Administration

#### 6.7.1 Reportable Content

**What can be reported:**
- **Products:** Spam, scams, prohibited items, inappropriate content
- **Users:** Fake accounts, harassment, fraud
- **Messages:** Harassment, spam, inappropriate content

**Report Reasons:**
```typescript
const REPORT_REASONS = {
  product: [
    'spam', // Duplicate/spam listings
    'scam', // Fraudulent/scam product
    'prohibited', // Prohibited items (weapons, drugs, etc.)
    'inappropriate', // Offensive/adult content
    'fake', // Counterfeit products
    'wrong_category', // Miscategorized
    'other' // Other reason (requires description)
  ],
  user: [
    'fake_account', // Fake/bot account
    'harassment', // Harassment or threats
    'fraud', // Fraudulent behavior
    'spam', // Spam messages
    'impersonation', // Impersonating someone
    'other'
  ],
  message: [
    'harassment', // Harassment or threats
    'spam', // Spam/advertising
    'inappropriate', // Inappropriate content
    'scam', // Scam attempt
    'other'
  ]
}
```

#### 6.7.2 Prohibited Content

**Strictly Prohibited:**
- Weapons, explosives, ammunition
- Illegal drugs or drug paraphernalia
- Stolen goods
- Counterfeit products
- Adult content / pornography
- Live animals (except pets with proper documentation)
- Human body parts or fluids
- Fake documents or IDs
- Pyramid schemes / MLM

**Restricted (Requires Verification):**
- Alcohol (must be licensed seller)
- Tobacco products (must be licensed seller)
- Prescription medications (must be licensed pharmacy)
- Vehicles (must have proper documentation)

#### 6.7.3 Report Workflow

**User Flow:**
```
1. User clicks "Report" button
   ↓
2. Select reason from dropdown
   ↓
3. Add optional description (max 500 chars)
   ↓
4. Submit report
   ↓
5. Confirmation: "Report submitted. We'll review within 24 hours"
```

**Admin Review Flow:**
```
1. Report appears in admin dashboard
   Status: PENDING
   ↓
2. Admin reviews report
   Status: REVIEWING
   ↓
3. Admin takes action:
   - Dismiss (false report)
   - Warn user
   - Hide content
   - Suspend user (7/30/permanent days)
   - Delete content
   Status: RESOLVED
   ↓
4. User receives notification of action taken
```

#### 6.7.4 Moderation Actions

**Warning:**
- User receives email notification
- Warning count increments
- 3 warnings = 7-day suspension

**Hide Content:**
- Product/message hidden from public view
- User can see it but marked as "Under Review"
- Can be restored if appeal succeeds

**Suspend User:**
- 7 days: First offense
- 30 days: Second offense
- Permanent: Third offense or severe violation
- User cannot login during suspension
- All active products hidden

**Delete Content:**
- Permanent removal
- Cannot be restored
- User notified with reason

**Ban User:**
- Permanent account termination
- All products deleted
- Email/phone blacklisted
- Cannot create new account

#### 6.7.5 Admin Dashboard

**Key Metrics:**
```typescript
interface AdminMetrics {
  // Users
  totalUsers: number
  newUsersToday: number
  activeUsers: number
  suspendedUsers: number
  
  // Products
  totalProducts: number
  activeProducts: number
  pendingReview: number
  deletedToday: number
  
  // Reports
  pendingReports: number
  resolvedToday: number
  avgResolutionTime: string // "2.5 hours"
  
  // Activity
  searchesToday: number
  messagesToday: number
  newProductsToday: number
}
```

**Admin Views:**
```
/admin/dashboard - Overview metrics
/admin/reports - Pending reports queue
/admin/users - User management
/admin/products - Product moderation
/admin/categories - Category management
/admin/analytics - Usage analytics
```

#### 6.7.6 Automated Moderation (Phase 2)

**Auto-flagging triggers:**
- Duplicate products (same title + images)
- Suspicious pricing (too low/high)
- Excessive reports (3+ reports = auto-hide)
- Spam keywords detected
- New user posting >10 products/day

**AI Moderation (Future):**
- Image content detection (NSFW, weapons, etc.)
- Text sentiment analysis
- Fake product detection
- Price anomaly detection

#### 6.7.7 Implementation Example

**Report Form:**
```typescript
// components/moderation/ReportForm.tsx
interface ReportFormProps {
  type: 'product' | 'user' | 'message'
  targetId: string
}

export function ReportForm({ type, targetId }: ReportFormProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  
  async function handleSubmit() {
    const { error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_type: type,
        reported_id: targetId,
        reason,
        description,
        status: 'pending'
      })
    
    if (!error) {
      toast.success('Report submitted successfully')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Select value={reason} onChange={setReason}>
        {REPORT_REASONS[type].map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </Select>
      
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Additional details (optional)"
        maxLength={500}
      />
      
      <button type="submit">Submit Report</button>
    </form>
  )
}
```

**Admin Review Interface:**
```typescript
// app/admin/reports/page.tsx
export default function AdminReportsPage() {
  const { data: reports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reporter_id(full_name, email),
          product:products(title, images),
          reported_user:profiles!reported_id(full_name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      return data
    }
  })
  
  async function handleAction(reportId: string, action: string) {
    // Update report status
    await supabase
      .from('reports')
      .update({
        status: 'resolved',
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        resolution_notes: action
      })
      .eq('id', reportId)
    
    // Take action (hide product, suspend user, etc.)
    if (action === 'hide_product') {
      await supabase
        .from('products')
        .update({ status: 'hidden' })
        .eq('id', report.reported_id)
    }
    
    // Send notification to reporter
    await sendNotification(report.reporter_id, 'report_resolved')
  }
  
  return (
    <div>
      <h1>Pending Reports ({reports?.length})</h1>
      {reports?.map(report => (
        <ReportCard
          key={report.id}
          report={report}
          onAction={handleAction}
        />
      ))}
    </div>
  )
}
```

#### 6.7.8 User Appeals

**Appeal Process:**
- User can appeal suspension/deletion within 7 days
- Appeal form requires explanation
- Admin reviews appeal within 48 hours
- Decision is final

**Appeal Form:**
```typescript
interface Appeal {
  user_id: string
  report_id: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
```

---

## 7. Funcionalidades — Fase 2 (Post-MVP)

### 7.1 Mejoras de Búsqueda Avanzada
- **Búsqueda por imagen:** Subir foto de un producto y encontrar similares (visual search)
- **Búsqueda por voz:** Integración con Web Speech API para búsquedas habladas
- **Filtros dinámicos:** Filtros que se adaptan según la categoría (ej: en electrónica mostrar "marca", "memoria RAM")
- **Alertas de búsqueda:** Notificar cuando aparezcan productos que coincidan con búsquedas guardadas
- **Re-ranking personalizado:** Ajustar resultados según historial y preferencias del usuario
- **Búsqueda multi-query:** "celular samsung O iphone" (operadores booleanos)

### 7.2 Otras Funcionalidades
- **Pasarela de pago:** Integración con QR de bancos bolivianos, tarjetas de débito/crédito.
- **Publicaciones de "Busco":** Los compradores publican lo que necesitan y los vendedores les contactan (demanda inversa).
- **App nativa:** Android (prioridad) e iOS.
- **Notificaciones push** avanzadas (alertas de precios, nuevos productos en categorías favoritas).
- **Favoritos y listas:** Guardar productos, crear listas de deseos.
- **Vendedor verificado con CI:** Verificación de identidad con carnet boliviano.
- **Tienda del vendedor:** Página personalizada tipo mini e-commerce.
- **Promociones y ofertas:** Herramientas para que vendedores creen descuentos temporales.
- **Sistema de envíos:** Integración con servicios de delivery locales (Pedidos Ya, mensajería).
- **IA para recomendaciones:** Sugerencias de productos basadas en historial de búsqueda y embeddings.
- **Soporte multiidioma:** Español + Quechua/Aymara (a futuro).

---

## 8. Requerimientos No Funcionales

| Atributo | Requerimiento | Implementación |
|---|---|---|
| **Performance** | Carga de página < 3s en conexiones 3G. Búsqueda < 500ms (p95). | Next.js SSR, Redis cache, CDN para imágenes, lazy loading |
| **Búsqueda** | Keyword search < 100ms, Semantic search < 300ms, Fusión < 100ms | Meilisearch optimizado, pgvector con índice HNSW, cache de embeddings populares |
| **Escalabilidad** | 1K → 100K usuarios sin refactorización mayor | FastAPI async, PostgreSQL con índices, horizontal scaling con load balancer |
| **Disponibilidad** | 99.5% uptime (43 min downtime/mes) | Health checks, auto-restart, backup diario de DB |
| **Seguridad** | HTTPS, passwords hasheados, inputs sanitizados, rate limiting | bcrypt/argon2, Pydantic validation, Redis rate limiter (10 req/s por IP) |
| **SEO** | Productos indexables en Google | Next.js SSR, meta tags dinámicos, sitemap.xml, robots.txt |
| **Accesibilidad** | Mobile-first, responsive, bajo consumo de datos | Tailwind CSS, imágenes WebP, compresión gzip/brotli |
| **Localización** | Moneda BOB, zona horaria Bolivia (UTC-4), español | i18n ready, formato de precios Bs. 1.234,56 |
| **Observabilidad** | Logs, métricas, alertas | Sentry (errores), Prometheus + Grafana (métricas), logs estructurados |

---

## 9. Ambiente de Desarrollo y Deployment

### 9.1 Project Structure (Supabase + Next.js)

```
telopillo/
├── frontend/                        # Next.js 14 (React + TypeScript)
│   ├── app/                        # App Router
│   │   ├── (auth)/                # Auth routes group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   ├── (marketplace)/         # Main app routes
│   │   │   ├── page.tsx          # Home/Search
│   │   │   ├── products/
│   │   │   │   ├── [id]/         # Product detail
│   │   │   │   └── new/          # Create product
│   │   │   ├── profile/
│   │   │   │   └── [userId]/
│   │   │   ├── chat/
│   │   │   │   └── [conversationId]/
│   │   │   └── layout.tsx
│   │   └── api/                   # API routes (if needed)
│   │       └── search/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── products/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   └── ProductGallery.tsx
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── Filters.tsx
│   │   │   └── SearchResults.tsx
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageList.tsx
│   │   │   └── MessageInput.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Supabase client
│   │   │   ├── server.ts         # Server-side client
│   │   │   └── middleware.ts     # Auth middleware
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useProducts.ts
│   │   │   └── useChat.ts
│   │   └── utils/
│   │       ├── image.ts          # Image optimization
│   │       └── search.ts         # Search utilities
│   ├── types/
│   │   ├── database.ts           # Supabase generated types
│   │   ├── product.ts
│   │   └── user.ts
│   ├── public/
│   ├── package.json
│   └── next.config.js
│
├── supabase/                       # Supabase configuration
│   ├── migrations/                # Database migrations
│   │   ├── 20240101000000_initial_schema.sql
│   │   ├── 20240102000000_add_pgvector.sql
│   │   ├── 20240103000000_add_full_text_search.sql
│   │   └── 20240104000000_add_rls_policies.sql
│   ├── functions/                 # Edge Functions (Deno)
│   │   ├── generate-embedding/
│   │   │   └── index.ts
│   │   ├── process-images/
│   │   │   └── index.ts
│   │   └── send-notification/
│   │       └── index.ts
│   ├── seed.sql                   # Seed data
│   └── config.toml                # Supabase config
│
├── search-service/                # FastAPI (Optional - Phase 2+)
│   ├── main.py                   # FastAPI app
│   ├── models.py                 # Sentence Transformers
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
│
├── Documentation/
│   ├── PRD.md
│   ├── DATABASE_SCHEMA.md        # Database documentation
│   └── API.md                    # API documentation
│
├── .env.example
├── .gitignore
├── README.md
└── package.json                   # Root package.json (optional)
```

### 9.2 Development Stack (Updated for Supabase)

```yaml
Frontend (TypeScript):
  - Next.js 14+ (App Router)
  - React 18+
  - TypeScript 5+
  - Tailwind CSS 3+
  - shadcn/ui (components)
  - @supabase/supabase-js (Supabase client)
  - @supabase/auth-helpers-nextjs (Auth helpers)
  - Zod (validation)
  - React Hook Form (forms)
  - Lucide React (icons)

Backend (Supabase - Managed):
  - PostgreSQL 15 with pgvector extension
  - PostgREST (auto-generated API)
  - GoTrue (authentication)
  - Realtime (WebSockets)
  - Storage (S3-compatible)
  - Edge Functions (Deno runtime)

Search Service (Optional - Phase 2+):
  - Python 3.11+
  - FastAPI 0.109+
  - sentence-transformers
  - numpy, scipy
  - supabase-py (Python client)
  - pytest (testing)

Development Tools:
  - Supabase CLI (local development)
  - Vercel CLI (deployment)
  - Prettier (code formatting)
  - ESLint (linting)
  - Playwright (E2E testing)
  - Jest (unit testing)
```

### 9.3 Local Development Environment (Supabase)

#### Option 1: Supabase Cloud (Recommended for MVP)

**Setup:**
```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
supabase link --project-ref your-project-ref

# 4. Pull remote schema (if exists)
supabase db pull

# 5. Start frontend
cd frontend
npm install
npm run dev
```

**Environment Variables (.env.local):**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Hugging Face (for embeddings)
HUGGINGFACE_API_KEY=your-hf-api-key

# Resend (for emails)
RESEND_API_KEY=your-resend-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

#### Option 2: Supabase Local (Full Offline Development)

**Setup:**
```bash
# 1. Initialize Supabase locally
supabase init

# 2. Start Supabase local stack
supabase start

# This will start:
# - PostgreSQL (port 54322)
# - Supabase Studio (port 54323) - UI Dashboard
# - PostgREST API (port 54321)
# - Realtime (port 54321)
# - Storage (port 54321)
# - Edge Functions (port 54321)

# 3. Apply migrations
supabase db reset

# 4. Start frontend
cd frontend
npm run dev
```

**Local Environment Variables (.env.local):**
```env
# Supabase Local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Hugging Face
HUGGINGFACE_API_KEY=your-hf-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Useful Commands:**
```bash
# View local services status
supabase status

# View logs
supabase logs

# Stop local stack
supabase stop

# Reset database (drop + recreate)
supabase db reset

# Generate TypeScript types from schema
supabase gen types typescript --local > types/database.ts

# Deploy Edge Function
supabase functions deploy generate-embedding
```

---

#### Option 3: Hybrid (Supabase Cloud + Local FastAPI for Search)

For Phase 2+ when you need local embedding generation:

```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: FastAPI Search Service (optional)
cd search-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**docker-compose.yml (Optional - Only for Search Service):**
```yaml
version: '3.8'

services:
  search-service:
    build: ./search-service
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - ./search-service:/app
    ports:
      - "8000:8000"
    environment:
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      MODEL_NAME: paraphrase-multilingual-MiniLM-L12-v2
```

### 9.4 Production Deployment (Supabase + Vercel)

#### Phase 1: MVP (0-10K users) - $0/month

```
Frontend:
  - Vercel (Free tier)
  - Automatic deployments from GitHub
  - Edge Network (CDN global)
  - SSL automático

Backend:
  - Supabase Cloud (Free tier)
  - PostgreSQL 15 + pgvector
  - Auth, Storage, Realtime incluidos
  - 500MB DB, 1GB storage, 2GB bandwidth

Embeddings:
  - Hugging Face Inference API (Free)
  - 30K requests/month
  - Serverless (Edge Functions)

Email:
  - Resend (Free tier)
  - 3K emails/month

Total: $0/month
Capacity: ~1,000-2,000 active users/month
```

---

#### Phase 2: Growth (10K-50K users) - $25-50/month

```
Frontend:
  - Vercel (Free tier) - $0

Backend:
  - Supabase Pro - $25/month
    - 8GB database
    - 100GB storage
    - 50GB bandwidth
    - Daily backups
    - Priority support

Embeddings (choose one):
  Option A: Keep Hugging Face API - $0
  Option B: FastAPI on Render Starter - $7/month
    - 512MB RAM
    - 24/7 uptime
    - Faster embeddings (~50ms vs ~500ms)

Email:
  - Resend (Free tier) - $0
  - Or upgrade to $20/month for 50K emails

CDN (optional):
  - Cloudflare R2 for large images - $0-10/month

Total: $25-50/month
Capacity: ~10K-50K active users/month
```

---

#### Phase 3: Scale (50K+ users) - $100-300/month

```
Frontend:
  - Vercel Pro - $20/month
    - Advanced analytics
    - Team collaboration
    - More bandwidth

Backend:
  - Supabase Pro - $25/month
  - Or Supabase Team - $599/month
    - Dedicated resources
    - Custom limits
    - SLA

Search:
  - FastAPI on Render Standard - $25/month
    - 2GB RAM
    - Better performance

CDN:
  - Cloudflare R2 - $15-50/month
  - Or Cloudflare Pro - $20/month

Monitoring:
  - Sentry - $26/month (errors)
  - Vercel Analytics - included

Total: $100-300/month
Capacity: 50K-200K active users/month
```

---

#### Deployment Steps

**1. Deploy Frontend to Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod

# Configure environment variables in Vercel dashboard
```

**2. Set up Supabase Production:**
```bash
# Already running on Supabase Cloud
# Just configure production environment variables

# Run migrations
supabase db push --db-url "postgresql://..."

# Deploy Edge Functions
supabase functions deploy generate-embedding
supabase functions deploy process-images
supabase functions deploy send-notification
```

**3. Configure Custom Domain:**
```bash
# In Vercel dashboard:
# - Add custom domain (telopillo.bo)
# - Configure DNS (CNAME to vercel-dns.com)
# - SSL automatic

# In Supabase dashboard:
# - Optional: Configure custom domain for API
```

**4. Set up CI/CD (GitHub Actions):**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-functions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Edge Functions
        run: |
          supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
```

### 9.5 CI/CD Pipeline (GitHub Actions + Vercel + Supabase)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Test Frontend
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Type check
        working-directory: ./frontend
        run: npm run type-check
      
      - name: Lint
        working-directory: ./frontend
        run: npm run lint
      
      - name: Run unit tests
        working-directory: ./frontend
        run: npm test
      
      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  # Test Database Migrations
  test-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
      
      - name: Start Supabase local
        run: supabase start
      
      - name: Run migrations
        run: supabase db reset
      
      - name: Verify schema
        run: supabase db diff

  # Deploy to Production (only on main branch)
  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: [test-frontend, test-migrations]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Deploy Frontend to Vercel
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./frontend
      
      # Deploy Edge Functions to Supabase
      - name: Deploy Edge Functions
        run: |
          supabase functions deploy generate-embedding \
            --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          
          supabase functions deploy process-images \
            --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          
          supabase functions deploy send-notification \
            --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  # Deploy to Staging (on develop branch)
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: [test-frontend, test-migrations]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

**Required GitHub Secrets:**
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_REF
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 10. Métricas de Éxito (KPIs)

### Lanzamiento (primeros 3 meses)
| Métrica | Objetivo |
|---|---|
| Usuarios registrados | 1,000 |
| Publicaciones activas | 500 |
| Búsquedas diarias | 200 |
| Tasa de contacto (click en "contactar") | > 15% de vistas |
| Retención semanal | > 30% |

### Crecimiento (6-12 meses)
| Métrica | Objetivo |
|---|---|
| Usuarios registrados | 10,000 |
| Publicaciones activas | 5,000 |
| Conversión a Premium | > 3% de vendedores |
| NPS (Net Promoter Score) | > 40 |

---

## 10. User Stories — MVP

### Comprador
- **Como comprador**, quiero buscar productos usando lenguaje natural (ej: "celu barato") para encontrar lo que necesito sin pensar en palabras exactas.
- **Como comprador**, quiero que el buscador entienda sinónimos bolivianos (ej: "chompa" = "buzo") para no tener que probar múltiples términos.
- **Como comprador**, quiero ver productos similares aunque no coincidan exactamente con mi búsqueda para descubrir alternativas.
- **Como comprador**, quiero filtrar por precio, ubicación y estado para ver solo lo que me interesa.
- **Como comprador**, quiero contactar al vendedor por WhatsApp o chat interno para coordinar la compra.
- **Como comprador**, quiero calificar al vendedor después de una compra para ayudar a otros compradores.
- **Como comprador**, quiero ver productos cerca de mi ubicación para facilitar la entrega o recojo.
- **Como comprador**, quiero recibir sugerencias de "productos similares" cuando veo algo que me gusta.

### Vendedor
- **Como vendedor**, quiero publicar un producto con fotos, precio y descripción para que los compradores lo encuentren.
- **Como vendedor**, quiero ver cuántas vistas tiene mi publicación para saber si hay interés.
- **Como vendedor**, quiero recibir notificaciones cuando alguien me contacte para responder rápido.
- **Como vendedor**, quiero marcar un producto como vendido para que ya no aparezca en búsquedas.
- **Como vendedor**, quiero actualizar mi plan a Premium para destacar mis productos.

### Administrador
- **Como administrador**, quiero moderar publicaciones reportadas para mantener la calidad del contenido.
- **Como administrador**, quiero ver métricas de uso para tomar decisiones sobre el producto.
- **Como administrador**, quiero gestionar categorías para organizar mejor el marketplace.

---

## 11. Wireframes de Referencia (Flujos Principales)

```
┌─────────────────────────────────────────────┐
│              FLUJO DEL COMPRADOR            │
│                                             │
│  Home → Buscar → Filtrar → Ver Producto     │
│         → Contactar Vendedor → Calificar    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              FLUJO DEL VENDEDOR             │
│                                             │
│  Home → Publicar Producto → Subir Fotos     │
│   → Definir Precio/Categoría → Publicar     │
│   → Dashboard → Ver Mensajes → Marcar       │
│     Vendido                                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              FLUJO DE REGISTRO              │
│                                             │
│  Landing → Registrarse (Email/Google/FB)    │
│   → Completar Perfil → Verificar Email      │
│   → Listo para Comprar/Vender              │
└─────────────────────────────────────────────┘
```

---

## 12. Roadmap de Alto Nivel

| Fase | Período | Entregables |
|---|---|---|
| **Fase 0 — Discovery** | Mes 1 | Validación de idea, diseño UI/UX, definición de arquitectura. |
| **Fase 1 — MVP** | Mes 2-4 | Backend API, frontend responsive, registro, publicación, búsqueda, contacto, deploy. |
| **Fase 2 — Iteración** | Mes 5-7 | Chat interno, reputación, geolocalización, Premium, optimizaciones de performance. |
| **Fase 3 — Crecimiento** | Mes 8-12 | Publicaciones de "Busco", pasarela de pago, app Android, campañas de adquisición. |
| **Fase 4 — Escala** | Año 2+ | IA, envíos, app iOS, expansión a más ciudades, integraciones. |

---

## 13. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Baja adopción inicial | Alto | Estrategia de lanzamiento en comunidades de Facebook y WhatsApp existentes. Onboarding simple. |
| Publicaciones spam/fraude | Alto | Moderación activa, sistema de reportes, límite de publicaciones gratuitas. |
| Competencia de Facebook Marketplace | Medio | Diferenciación con funcionalidades locales (BOB, geolocalización boliviana, WhatsApp nativo). |
| Infraestructura de internet limitada en Bolivia | Medio | Diseño ultraliviano, optimización de imágenes, progressive web app (PWA). |
| Monetización lenta | Medio | Comenzar freemium, validar valor antes de cobrar. Mantener costos operativos bajos. |

---

## 14. Competencia y Diferenciación

| Plataforma | Debilidad | Ventaja de Telopillo |
|---|---|---|
| Facebook Marketplace | Búsqueda básica por keywords, sin filtros avanzados, no hay perfiles de vendedor, no hay reputación | **Búsqueda semántica inteligente**, perfiles con calificación, categorías organizadas, entiende lenguaje coloquial boliviano |
| Grupos de WhatsApp | Caótico, sin búsqueda, se pierde la información | Publicaciones persistentes, **buscador semántico**, filtros, productos similares |
| OLX (ya no opera activamente en Bolivia) | Abandonó el mercado, búsqueda limitada | Presencia local, identidad boliviana, **búsqueda que entiende contexto** |
| Mercado Libre | No tiene foco en Bolivia, búsqueda genérica para LATAM | 100% enfocado en Bolivia, moneda BOB, ubicaciones locales, **búsqueda optimizada para modismos bolivianos** |

---

## 15. Deep Dive: Sistema de Búsqueda Semántica

### 15.1 Objetivos de la Búsqueda

**Objetivo Principal:** Que los usuarios encuentren lo que buscan en el primer intento, incluso si no saben cómo describirlo exactamente.

**Métricas de Éxito:**
- **Zero-result rate < 5%** (búsquedas sin resultados)
- **CTR en primeros 3 resultados > 60%**
- **Time to contact < 2 minutos** desde búsqueda inicial
- **Search refinement rate < 30%** (usuarios que modifican su búsqueda)

### 15.2 Arquitectura Técnica Detallada

```
┌─────────────────────────────────────────────────────────────┐
│                    PIPELINE DE BÚSQUEDA                      │
└─────────────────────────────────────────────────────────────┘

1. INPUT: Query del usuario
   ↓
2. PREPROCESAMIENTO
   ├─ Normalización (lowercase, acentos)
   ├─ Tokenización
   ├─ Detección de idioma (español/quechua/aymara)
   └─ Corrección ortográfica
   ↓
3. BÚSQUEDA PARALELA (Dual Path)
   ├─ PATH A: Keyword Search (Elasticsearch/Meilisearch)
   │  ├─ Match en título (boost: 3x)
   │  ├─ Match en descripción (boost: 1x)
   │  ├─ Match en categoría (boost: 2x)
   │  └─ Filtros aplicados (precio, ubicación, estado)
   │
   └─ PATH B: Semantic Search (Vector DB)
      ├─ Generar embedding del query (384 dims)
      ├─ Búsqueda por similitud coseno (top 50)
      └─ Threshold de similitud > 0.7
   ↓
4. FUSIÓN DE RESULTADOS
   ├─ Reciprocal Rank Fusion (RRF)
   ├─ Deduplicación
   └─ Re-ranking final
   ↓
5. POST-PROCESAMIENTO
   ├─ Aplicar boost por Premium (1.5x)
   ├─ Aplicar boost por recencia (decay function)
   ├─ Aplicar boost por reputación vendedor
   └─ Diversificación (evitar que un vendedor domine resultados)
   ↓
6. OUTPUT: Lista rankeada de productos
```

### 15.3 Generación de Embeddings

**Al momento de publicar un producto:**
```python
# Pseudocódigo
product_text = f"{title} {description} {category} {subcategory}"
embedding = embedding_model.encode(product_text)
# Vector de 384 dimensiones (usando paraphrase-multilingual-mpnet-base-v2)

# Almacenar en:
# - PostgreSQL (pgvector): para productos
# - Vector DB (Qdrant/Pinecone): para búsqueda rápida
```

**Al realizar una búsqueda:**
```python
# Pseudocódigo
query_embedding = embedding_model.encode(user_query)
similar_products = vector_db.search(
    query_vector=query_embedding,
    limit=50,
    score_threshold=0.7
)
```

### 15.4 Casos de Uso Específicos

| Búsqueda del Usuario | Productos Encontrados | Técnica |
|---|---|---|
| "celu barato" | Celulares de < 1000 BOB | Keyword + filtro precio |
| "smartphone económico" | Celulares de < 1000 BOB | Semántica (sinónimo) |
| "telefono samsumg" (typo) | Teléfonos Samsung | Corrección ortográfica |
| "chompa para el frío" | Buzos, sudaderas, chompas | Semántica (sinónimos regionales) |
| "algo para mi bebé" | Ropa, juguetes, pañales | Semántica (contexto) |
| "tele grande para ver fútbol" | TVs 50"+, Smart TVs | Semántica (intención) |
| "auto usado en Santa Cruz" | Vehículos usados en SCZ | Keyword + filtros |

### 15.5 Optimizaciones de Performance

**Caching:**
- Cache de embeddings de queries populares (Redis)
- Cache de resultados de búsqueda (TTL: 5 minutos)
- Pre-computar embeddings de todos los productos (batch nocturno)

**Indexación:**
- Índices en PostgreSQL para filtros (precio, ubicación, fecha)
- Vector index en Qdrant (HNSW algorithm) para búsqueda rápida
- Sharding por categoría si el catálogo crece > 100K productos

**Latencia Target:**
- Keyword search: < 100ms
- Semantic search: < 300ms
- Fusión y ranking: < 100ms
- **Total: < 500ms (p95)**

### 15.6 Mejora Continua (Learning Loop)

```
┌─────────────────────────────────────────────┐
│         CICLO DE MEJORA CONTINUA            │
└─────────────────────────────────────────────┘

1. Capturar datos de interacción:
   - Búsquedas realizadas
   - Clicks en resultados (posición)
   - Contactos a vendedores
   - Búsquedas sin resultados

2. Análisis semanal:
   - Identificar búsquedas con bajo CTR
   - Detectar sinónimos no cubiertos
   - Encontrar gaps en el catálogo

3. Ajustes:
   - Agregar sinónimos al diccionario
   - Re-entrenar modelo con datos reales (Fase 2)
   - Ajustar pesos de fusión RRF
   - Actualizar boost factors

4. A/B Testing:
   - Probar diferentes algoritmos de ranking
   - Validar mejoras con métricas reales
```

### 15.7 Diccionario de Sinónimos Bolivianos (Inicial)

Este diccionario se expandirá con datos reales:

```yaml
# Ropa
chompa: [buzo, sudadera, hoodie, polera_con_capucha]
polera: [camiseta, remera, playera]
pantalon: [jean, vaquero, jeans]

# Electrónica
celular: [smartphone, telefono, movil, celu, fono]
computadora: [laptop, notebook, compu, pc]
tele: [television, tv, televisor]

# Vehículos
auto: [carro, vehiculo, automovil]
moto: [motocicleta, motito]

# Hogar
refri: [refrigeradora, nevera, heladera, refrigerador]
cocina: [cocinilla, estufa]

# Construcción
cemento: [concreto]
ladrillo: [bloque, block]

# Coloquialismos
barato: [economico, accesible, bajo_precio]
nuevo: [sin_uso, sin_estrenar, 0km]
usado: [segunda_mano, de_segunda]
```

### 15.8 Roadmap de Búsqueda

| Fase | Capacidad |
|---|---|
| **MVP (Mes 2-4)** | Búsqueda híbrida keyword + semántica básica, sinónimos manuales |
| **Fase 2 (Mes 5-7)** | Autocompletado inteligente, corrección ortográfica avanzada, "productos similares" |
| **Fase 3 (Mes 8-12)** | Búsqueda por imagen, búsqueda por voz, alertas de búsqueda |
| **Fase 4 (Año 2+)** | Fine-tuning del modelo con datos bolivianos, re-ranking personalizado, búsqueda multimodal |

---

## 16. Consideraciones Legales

- Términos y condiciones de uso.
- Política de privacidad (cumplimiento con regulaciones bolivianas de protección de datos).
- Política de contenido prohibido (armas, drogas, productos ilegales).
- Deslinde de responsabilidad sobre transacciones entre usuarios.
- Registro de NIT si se genera facturación por suscripciones Premium.

---

*Este documento es un punto de partida vivo. Se actualizará conforme avance el desarrollo y se validen hipótesis con usuarios reales.*
