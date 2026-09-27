# PATTERN-INSTANCES — buscar-business-card

Result-card family across /buscar entity tabs and sibling card surfaces:

- instance: components/search/BusinessResultCard.tsx disposition: in-scope
- instance: components/search/PersonResultCard.tsx disposition: in-scope
- instance: components/demand/DemandPostCard.tsx disposition: not-affected
  (solicitudes tab keeps its feed-style card; different content shape — post text
  + replies — not a directory listing)
- instance: components/products/ProductCard.tsx disposition: not-affected
  (reference pattern — the look to match, not to modify)
- instance: components/products/ProductGrid.tsx disposition: not-affected
  (reference grid container; /buscar keeps its own grid wrapper)
- instance: components/products/SellerCard.tsx disposition: not-affected
  (storefront/shared-profile seller header; link rule source, unchanged)
