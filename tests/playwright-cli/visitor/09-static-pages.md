# Visitor Flow 09: Static Pages and Error Handling

## Description

Verifies that an unauthenticated visitor can access all static/info pages and that the 404 error page displays correctly.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- No authentication required

## Test Steps

### 1. Terms page

```
playwright-cli navigate http://localhost:3000/terminos
playwright-cli snapshot
```

**Expected:** Terms page renders with heading and content. Proper page structure.

### 2. Privacy page

```
playwright-cli navigate http://localhost:3000/privacidad
playwright-cli snapshot
```

**Expected:** Privacy policy page renders with content.

### 3. Cookies page

```
playwright-cli navigate http://localhost:3000/cookies
playwright-cli snapshot
```

**Expected:** Cookies policy page renders with content.

### 4. Security page

```
playwright-cli navigate http://localhost:3000/seguridad
playwright-cli snapshot
```

**Expected:** Security/tips page renders with content.

### 5. Help page

```
playwright-cli navigate http://localhost:3000/ayuda
playwright-cli snapshot
```

**Expected:** Help/FAQ page renders with content.

### 6. About page

```
playwright-cli navigate http://localhost:3000/acerca
playwright-cli snapshot
```

**Expected:** About page renders with content.

### 7. Contact page

```
playwright-cli navigate http://localhost:3000/contacto
playwright-cli snapshot
```

**Expected:** Contact page renders with content and/or contact form.

### 8. 404 error page

```
playwright-cli navigate http://localhost:3000/nonexistent-page
playwright-cli snapshot
```

**Expected:** 404 error page displays. Message indicates page not found. Link to return home.

### 9. Verify each page has proper heading and content

```
playwright-cli assert [main-heading] --visible
```

**Expected:** Each static page has an h1 or main heading. Content is present (not empty).

### 10. Verify navigation back to home

```
playwright-cli navigate http://localhost:3000/terminos
playwright-cli click [home-link]
playwright-cli snapshot
```

**Expected:** From any static page, clicking "Inicio" or header logo navigates to home (`/`).

## Verification Checklist

- [ ] /terminos renders with content
- [ ] /privacidad renders with content
- [ ] /cookies renders with content
- [ ] /seguridad renders with content
- [ ] /ayuda renders with content
- [ ] /acerca renders with content
- [ ] /contacto renders with content
- [ ] /nonexistent-page shows 404 error page
- [ ] Each static page has proper heading and content
- [ ] Navigation back to home works from each page
