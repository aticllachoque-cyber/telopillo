# M4.6 Implementation Plan

**Milestone:** Share Profile Link  
**Estimated Duration:** 1-2 days  
**Priority:** MEDIUM-HIGH

---

## Phase 1: ShareProfile Component (Half day)

**Estimated Duration:** 2-3 hours

### Tasks

1. Create `components/profile/ShareProfile.tsx`
   - Client component (`'use client'`)
   - Props: `profileId: string`, `businessSlug?: string | null`, `variant?: 'card' | 'compact'`
   - Compute `shareUrl` from props and `NEXT_PUBLIC_APP_URL` env var
   - Detect Web Share API availability with `typeof navigator.share === 'function'`
   - Implement `handleCopy()`:
     - `navigator.clipboard.writeText(shareUrl)`
     - Toast: "Enlace copiado" (success)
     - Error toast: "No se pudo copiar el enlace" (error)
   - Implement `handleShare()`:
     - `navigator.share({ title, text, url })`
     - On `AbortError`: silent (user cancelled)
     - On other error: fall back to `handleCopy()`
   - Card variant:
     - shadcn Card with CardHeader + CardContent
     - URL preview in styled container (truncated, monospace)
     - Two buttons: "Copiar enlace" (Copy icon) + "Compartir" (Share2 icon)
     - "Compartir" button hidden when Web Share API unavailable
   - Compact variant:
     - Single Button (variant="outline", size="sm")
     - Share2 icon + "Compartir perfil" text
     - On click: `handleShare()` if available, else `handleCopy()`

### Deliverables
- `components/profile/ShareProfile.tsx`

### Files
| File | Action |
|------|--------|
| `components/profile/ShareProfile.tsx` | Create |

---

## Phase 2: Profile Page Integration (Half day)

**Estimated Duration:** 2-3 hours

### Tasks

1. Update `app/profile/page.tsx`
   - Add import for `ShareProfile`
   - Fetch `business_profiles.slug` alongside existing profile query:
     ```typescript
     const { data: business } = await supabase
       .from('business_profiles')
       .select('slug')
       .eq('id', user.id)
       .single()
     ```
   - Add state for `businessSlug`
   - Insert `<ShareProfile>` card between profile header card and "Mis Publicaciones" card:
     ```tsx
     <ShareProfile
       profileId={profile.id}
       businessSlug={businessSlug}
       variant="card"
     />
     ```

2. Verify on desktop:
   - URL preview shows correct link
   - "Copiar enlace" copies to clipboard
   - Toast appears
   - "Compartir" button hidden (no Web Share on desktop)

3. Verify on mobile (or responsive mode):
   - "Compartir" button visible
   - Native share sheet opens
   - WhatsApp appears as share target

### Deliverables
- Updated `app/profile/page.tsx` with ShareProfile card + business slug fetch

### Files
| File | Action |
|------|--------|
| `app/profile/page.tsx` | Modify |

---

## Phase 3: Product Management Integration (Half day)

**Estimated Duration:** 1-2 hours

### Tasks

1. Update `app/perfil/mis-productos/page.tsx`
   - Add import for `ShareProfile`
   - Fetch `business_profiles.slug` (page already has user context):
     ```typescript
     const { data: business } = await supabase
       .from('business_profiles')
       .select('slug')
       .eq('id', user.id)
       .single()
     ```
   - Add compact ShareProfile in the page header area (near "Publicar Nuevo" button):
     ```tsx
     <ShareProfile
       profileId={user.id}
       businessSlug={businessSlug}
       variant="compact"
     />
     ```

2. Run ESLint on all modified files

3. Browser verification:
   - Desktop: copy works on both pages
   - Mobile: native share works on both pages
   - Toast appears correctly

### Deliverables
- Updated `app/perfil/mis-productos/page.tsx` with compact ShareProfile
- All files pass ESLint

### Files
| File | Action |
|------|--------|
| `app/perfil/mis-productos/page.tsx` | Modify |

---

## Testing Checklist

### Manual Testing

- [ ] `/profile` shows "Compartir mi perfil" card
- [ ] URL preview shows correct link (personal or business)
- [ ] "Copiar enlace" copies URL to clipboard
- [ ] Toast "Enlace copiado" appears on copy
- [ ] "Compartir" button visible on mobile
- [ ] Native share opens on mobile tap
- [ ] Share includes title, text, and URL
- [ ] WhatsApp receives the shared link correctly
- [ ] `/perfil/mis-productos` shows compact share button
- [ ] Compact button triggers share/copy correctly
- [ ] Component not rendered when profile data is missing
- [ ] Works in both light and dark mode

### Edge Cases

- [ ] User with no business profile sees `/vendedor/{id}` URL
- [ ] User with business profile sees `/negocio/{slug}` URL
- [ ] Clipboard fails gracefully with error toast
- [ ] Share cancellation is silent (no error)
- [ ] Very long business slugs are truncated in preview

---

## Rollback Plan

All changes are additive UI components. Rollback is straightforward:
1. Remove `ShareProfile` imports from `profile/page.tsx` and `mis-productos/page.tsx`
2. Delete `components/profile/ShareProfile.tsx`
3. No database or API changes to revert

---

## Definition of Done

- [ ] `ShareProfile` component created with card and compact variants
- [ ] `/profile` page shows share card with correct URL
- [ ] `/perfil/mis-productos` shows compact share button
- [ ] Clipboard copy works with toast feedback
- [ ] Web Share API works on mobile
- [ ] ESLint passes on all modified files
- [ ] No new npm dependencies added
- [ ] Manual testing checklist completed
