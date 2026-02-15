---
description: Language and internationalization policy for Telopillo.bo
globs: ["**/*.ts", "**/*.tsx"]
---

# Language Policy

## Code & Documentation
- All code (variable names, function names, class names, comments) MUST be in **English**.
- All documentation (README, PRD, Architecture docs) MUST be in **English**.

## User-Facing Strings (Intentional Spanish)
- All **user-facing text** (validation messages, UI labels, button text, error messages, placeholder text) is written in **Spanish** (Bolivian market).
- This is an intentional design decision, NOT a language policy violation.
- Examples of valid Spanish strings in code:
  - Validation: `'El nombre debe tener al menos 2 caracteres'`
  - UI labels: `'Nombre Completo'`, `'Contraseña'`
  - Badges: `'Nuevo Vendedor'`, `'Negocio con Telefono'`
  - Toasts: `'Perfil de negocio creado'`

## Future i18n
- When internationalization is implemented, Spanish strings will be extracted to locale files.
- Until then, hardcoded Spanish is acceptable for user-facing content only.
