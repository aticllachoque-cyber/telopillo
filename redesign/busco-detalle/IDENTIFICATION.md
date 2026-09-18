# IDENTIFICATION — busco-detalle

> Stage 2 output. Screenshot → route → component mapping with evidence.
> Gate G1: every `components/**.tsx` path listed here must exist on disk.

## Input

- Screenshot(s): `redesign/busco-detalle/input/prod-desktop.png` (producción, 2026-09-18)
- Route: `/busco/[id]` (top-level, ruta pública con estados dependientes de auth)

## Route mapping

| Evidence (visible string / landmark / class) | Matched in | File |
|---|---|---|
| "Volver a solicitudes" | grep `app/` + `components/` | components/demand/DemandPostPageClient.tsx:76 (renderizado por app/busco/[id]/page.tsx vía DemandPostPageClient) |
| title prod "Busco Reloj Smart Garmin en Santa Cruz de la Sierra \| Telopillo" | buildDemandSocialTitle | app/busco/[id]/page.tsx:60-66 |
| WhatsApp prefill "Alguien busca esto en Telopillo:" | buildDemandWhatsAppPrefillMessage (usado en DemandPostDetail) | components/demand/DemandPostDetail.tsx:136-139 |

## Component mapping

| Component | File | Evidence |
|-----------|------|----------|
| DemandPostPageClient | components/demand/DemandPostPageClient.tsx | matched "Volver a solicitudes" at :76 |
| DemandPostDetail | components/demand/DemandPostDetail.tsx | matched "Aún no hay ofertas. Sé el primero en proponer un producto." at :299; "Esta persona publicó la necesidad y recibirá las ofertas." at :321; "¿Tienes lo que esta persona busca?" at :388; "Inicia sesión para ofrecer" at :392 |
| DemandStatusBadge | components/demand/DemandStatusBadge.tsx | badge "Activo" bajo H1 (DemandPostDetail.tsx:169) |
| DemandImageFrame | components/demand/DemandImageFrame.tsx | imagen "Busco Reloj Smart Garmin" bajo meta (DemandPostDetail.tsx:194-200) |
| OfferProductModal | components/demand/OfferProductModal.tsx | botón "Ofrecer producto" → modal (DemandPostDetail.tsx:417-428) |
| OfferCard (interno) | components/demand/DemandPostDetail.tsx:433-497 | lista "Ofertas (N)" con productos ofertados |

## DOM snapshot confirmation

- playwright-cli snapshot: `redesign/busco-detalle/input/prod-dom.yml` — landmark "Esta persona publicó la necesidad y recibirá las ofertas." present: yes (ref e85)
- Badges Activo/Electrónica y Tecnología/Accesorios, meta MapPin/Calendar/Clock, Resumen (aria-label), Descripción, Ofertas (0) empty state, sidebar Comprador + WhatsApp, CTA "Inicia sesión para ofrecer" — todos presentes en snapshot prod.

## Landmark (verbatim visible string)

Recorded to `redesign/busco-detalle/landmark.txt`:

```
Esta persona publicó la necesidad y recibirá las ofertas.
```

## Identified files (scope)

Recorded to `redesign/busco-detalle/scope.txt` — exact paths, one per line; `redesign/` as final directory-prefix entry:

```
app/busco/[id]/page.tsx
components/demand/DemandPostPageClient.tsx
components/demand/DemandPostDetail.tsx
components/demand/DemandStatusBadge.tsx
components/demand/DemandImageFrame.tsx
components/demand/OfferProductModal.tsx
redesign/busco-detalle
```
