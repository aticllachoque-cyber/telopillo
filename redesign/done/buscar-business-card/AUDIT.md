# AUDIT — buscar-business-card

Audit scope: Negocios tab result presentation on `/buscar?type=negocios` vs the
Productos tab sibling pattern (`ProductCard` + `ProductGrid`). Personas tab
(`PersonResultCard`) audited as the in-scope family sibling. Baseline a11y of
/buscar is clean (accessibility-audit 31/31 on the unified-search merge).

### F-1 (P1) Business card has no visual hierarchy — reads as a debug list, not a result card
evidence: BusinessResultCard.tsx:38-75 — 56px avatar + name + two truncated muted one-liners + a text chevron; no image-scale anchor, no description, category buried in a muted join. Side-by-side: current/desktop.png (negocios) vs current/desktop-productos.png — product cards have aspect-4/3 image, h3 title, price, MapPin row, seller row, meta footer.
guideline: consistency with sibling result cards (Nielsen #4); scannability.

### F-2 (P1) Single-column full-width rows leave large dead space on desktop/tablet
evidence: app/buscar/page.tsx:395 `<ul role="list" className="flex flex-col gap-3">` — one card per row at ~1100px main-column width with ~500px of content (current/desktop.png rows stretch full width; right half empty). Productos tab uses `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (ProductGrid.tsx:52).
guideline: responsive layout / efficient screen use at ≥768px.

### F-3 (P2) Business identity tile too small; only visual element is a 56px avatar
evidence: BusinessResultCard.tsx:41-46 `Avatar h-14 w-14`. Businesses have no cover image — the logo (or initials on `getAvatarColor`) is the identity surface and it is 1/8th of the card width. ProductCard counterpart: aspect-[4/3] image block (ProductCard.tsx:106-138).
guideline: visual hierarchy; brand recognition.

### F-4 (P2) Richest field — business_description — never rendered
evidence: types/database.ts:717 (SearchBusiness.business_description) has no consumer in BusinessResultCard.tsx (grep: zero references). A directory card without any "what is this business" text forces a click-through to judge relevance.
guideline: information scent (search results should support evaluation without click).

### F-5 (P2) Inline hardcoded emerald "Verificado" badge diverges from the shared VerificationBadge component
evidence: BusinessResultCard.tsx:51-55 and PersonResultCard.tsx:62-63 both inline a `<span>` with hardcoded `emerald-200/50/700/900/950` values, while the repo's shared `components/ui/VerificationBadge.tsx` is used by SellerCard, SellerProfileHeader and BusinessHeader. Token drift + component divergence.
guideline: token consistency (app/globals.css oklch palette); G3d pattern consistency.

### F-6 (P2) Card heading semantics: business name is a `<p>`, not a heading
evidence: BusinessResultCard.tsx:50 `<p className="truncate font-semibold">` — ProductCard titles are `h3` (ProductCard.tsx:171-174). Result lists scan better and screen-reader heading navigation works when result titles are headings.
guideline: WCAG 2.2 — structure/headings; sibling consistency.

### Out of scope (documented)
- DemandPostCard (solicitudes) keeps feed-style: different content shape (post + replies), not a directory listing — PATTERN-INSTANCES not-affected.
- Sort/filters/tabs behavior: working, recently shipped (unified-search).
