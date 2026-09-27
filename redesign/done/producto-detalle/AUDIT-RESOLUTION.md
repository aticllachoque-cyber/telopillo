# AUDIT-RESOLUTION — producto-detalle

Una fila por hallazgo de `AUDIT.md`. Branch `redesign/producto-detalle`, commit `205d5cf`.

| Finding | Severidad | Disposición | Detalle |
|---|---|---|---|
| F-1 (P1) CTA primaria bajo el fold en móvil | P1 | resolved | Bloque compacto precio + CTA WhatsApp (`lg:hidden`) dentro de la card de detalle, antes de Descripción. Misma lógica de contacto que SellerCard (`resolveSellerWhatsAppDigits` + prefill). Verificado en `after/mobile.png`. |
| F-2 (P1) Botón "Reportar" sin acción | P1 | resolved | `AlertDialog` con RadioGroup de motivos + confirmación. Afrodancia real entregada según scope aprobado (comparison.html F-2: "dialog se implementa en Stage 8, scope ProductDetailPageClient"). **Nota honesta:** sin persistencia backend — no existe tabla/API de reportes en scope; la confirmación es feedback de UI aprobado en el sign-off. Persistencia real queda como item futuro. |
| F-3 (P2) Flechas de galería bajo 44px | P2 | resolved | `size-11` (44px), `rounded-full`, sin `md:opacity-70` (siempre visibles). `ProductGallery.tsx`. |
| F-4 (P2) Galería desplaza título/precio bajo el fold | P2 | resolved | `aspect-[4/3]` en galería principal; título + precio en fila sobre la card, arriba del fold. Verificado en `after/desktop.png`. |
| F-5 (P2) Escala verde fuera de tokens | P2 | resolved | Se reutiliza `productPresentation.whatsappButtonClass` (Tailwind `green-700`/`green-50` — mismos valores que los hex aprobados #15803d/#f0fdf4, ahora vía clases compartidas). Sin hex nuevos en el diff (G7b). Paleta resto: tokens neutros del sitio. |
| F-6 (P2) "Volver" pierde contexto | P2 | resolved | `Volver` movido a la fila del breadcrumb (derecha); `router.back()` con fallback a `/`. Deferred en propuesta según plan aprobado, implementado en Stage 8. |

## Estado

- P0 abiertos: 0 · P1 abiertos: 0 · P2 abiertos: 0
- Deuda pre-existente fuera de scope (`color-contrast` en `/buscar` + storefront): sin cambio — requiere item propio (G6 a nivel repo puede seguir BLOCKeada por ella).
