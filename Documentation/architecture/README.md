# Documentación de arquitectura (deep-dives)

Esta carpeta contiene los documentos de **profundidad** arquitectural. Para la **visión general**, ver [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

| Doc | Qué cubre |
|-----|-----------|
| [DATA_MODEL.md](./DATA_MODEL.md) | Modelo de datos: tablas, relaciones (ERD), índices, funciones RPC. |
| [SECURITY_RLS_MODEL.md](./SECURITY_RLS_MODEL.md) | Modelo de seguridad: matriz RLS tabla × operación, clientes Supabase, storage, límites de PII. |
| [decisions.md](./decisions.md) | ADRs — registros de decisiones arquitecturales (pgvector, server actions, embeddings, CI, RLS). |

> **Fuente de verdad del schema:** `supabase/migrations/*.sql` (24 migraciones) y `types/database.ts` (esquema tipado). Estos docs son un reflejo legible; si hay conflicto, gana el código.
