# Telopillo — Documentación

Índice de la documentación del proyecto. Organizado por propósito.

> Idioma: la documentación va en español; el código en inglés (ver `CLAUDE.md`).

## Especificación de producto

| Doc | Descripción |
|-----|-------------|
| [PRD.md](./PRD.md) | Product Requirements Document maestro (v1.5). Fuente de verdad de alcance y requisitos. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura técnica del sistema (visión general). |

### Arquitectura (deep-dives)

Documentos de profundidad bajo [`architecture/`](./architecture/README.md):

- [architecture/DATA_MODEL.md](./architecture/DATA_MODEL.md) — Modelo de datos, ERD, índices, RPCs.
- [architecture/SECURITY_RLS_MODEL.md](./architecture/SECURITY_RLS_MODEL.md) — Matriz RLS, clientes Supabase, límites de PII.
- [architecture/decisions.md](./architecture/decisions.md) — Decisiones arquitecturales (ADRs).

## Estado y backlog

| Doc | Descripción |
|-----|-------------|
| [status/PROJECT_STATUS.md](./status/PROJECT_STATUS.md) | Estado actual del proyecto y progreso por milestone. |
| [status/BUG_AUDIT_2026-05-29.md](./status/BUG_AUDIT_2026-05-29.md) | ⚠️ **Backlog activo de bugs** (seguridad/calidad). No es histórico: TELO-004 parcial, TELO-007–035, TELO-010/013 abiertos. Consultar primero al hacer mantenimiento. |

## Setup y guías operativas

| Doc | Descripción |
|-----|-------------|
| [../SUPABASE_SETUP.md](../SUPABASE_SETUP.md) | Configuración Supabase (proyecto, credenciales, extensiones, buckets, auth). |
| [setup/HTTPS-LOCAL-DEV.md](./setup/HTTPS-LOCAL-DEV.md) | HTTPS en desarrollo local (certificados). |
| [setup/ADB-SETUP.md](./setup/ADB-SETUP.md) | Conexión ADB para testing en dispositivo Android. |
| [setup/E2E-CONNECTED-DEVICE.md](./setup/E2E-CONNECTED-DEVICE.md) | Testing E2E en dispositivo físico conectado. |
| [setup/TEST_USERS.md](./setup/TEST_USERS.md) | Usuarios de prueba y credenciales. |

## Testing y QA

| Doc | Descripción |
|-----|-------------|
| [testing/REGRESSION_GUARDRAILS.md](./testing/REGRESSION_GUARDRAILS.md) | Guardrails de regresión (qué no romper). |
| [testing/AUTH_OAUTH_DESKTOP_MANUAL_TEST_PLAN.md](./testing/AUTH_OAUTH_DESKTOP_MANUAL_TEST_PLAN.md) | Plan de test manual OAuth en desktop. |

## Tooling interno

| Doc | Descripción |
|-----|-------------|
| [tooling/HARNESS_FLOWS.md](./tooling/HARNESS_FLOWS.md) | Flujo de los meta-skills harness (designer → implementer → validator → enhancer). |

## Milestones

| Doc | Descripción |
|-----|-------------|
| [milestones/README.md](./milestones/README.md) | Roadmap de milestones (M0–M15) y estado. |
| [milestones/CONCORDANCE.md](./milestones/CONCORDANCE.md) | Mapeo PRD ↔ Arquitectura ↔ Milestones. *(stale: referencia PRD v1.4)* |

Cada milestone completado (M0–M4.7) conserva su `README.md` + docs de referencia (PRD/ARCHITECTURE). Los docs de build (IMPLEMENTATION_PLAN, PROGRESS, TESTING, etc.) se archivaron.

## Histórico (`archive/`)

[`archive/`](./archive/) contiene docs de build de milestones completados y reportes one-shot (bug audits antiguos, revisiones de search/resilience, reportes de demanda/demo, auditorías de accesibilidad). Conservados para referencia, no se mantienen activamente.
