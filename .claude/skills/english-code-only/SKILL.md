---
name: english-code-only
description: Enforce English language for all code, variable names, function names, class names, comments, commit messages, and test files. Allow Spanish only in Documentation/ or docs/ folders. Use this skill whenever writing or reviewing code, naming variables, writing comments, or creating any code-related content.
---

# English Code Only

## Core Rule

**All code must be written in English, except documentation in Documentation/ or docs/ folders.**

This includes:
- Variable names
- Function names
- Class names
- Method names
- Constants
- Code comments
- Docstrings
- Commit messages
- Test descriptions
- Error messages
- Log messages
- Configuration keys
- API endpoint names
- Database field names

## Documentation Exception

**Spanish is allowed ONLY in:**
- Files inside `Documentation/` folder
- Files inside `docs/` folder

**Spanish is NOT allowed in:**
- README.md files in the root or other folders
- Inline code comments
- Docstrings in code files
- Any `.py`, `.js`, `.ts`, `.java`, `.go`, or other code files

## Enforcement

When writing code:

1. **ALWAYS use English** for all identifiers and comments
2. **REFUSE to write Spanish** in code contexts
3. **If the user provides Spanish names**, translate them to English before implementing
4. **If reviewing code with Spanish**, flag it and suggest English alternatives

## Examples

### ✅ Correct (English)

```python
# User authentication service
class UserAuthenticationService:
    def validate_credentials(self, username: str, password: str) -> bool:
        """Validate user credentials against database."""
        if not username or not password:
            raise ValueError("Username and password are required")
        return self._check_database(username, password)
```

### ❌ Incorrect (Spanish in code)

```python
# Servicio de autenticación de usuarios
class ServicioAutenticacionUsuario:
    def validar_credenciales(self, nombre_usuario: str, contraseña: str) -> bool:
        """Valida las credenciales del usuario contra la base de datos."""
        if not nombre_usuario or not contraseña:
            raise ValueError("Nombre de usuario y contraseña son requeridos")
        return self._verificar_base_datos(nombre_usuario, contraseña)
```

### ✅ Correct (Spanish in documentation)

**File: Documentation/architecture.md**
```markdown
# Arquitectura del Sistema

Este documento describe la arquitectura general del sistema...
```

## Translation Guidelines

When translating Spanish concepts to English:

| Spanish Term | English Translation |
|--------------|---------------------|
| usuario | user |
| contraseña | password |
| nombre | name |
| apellido | last_name / surname |
| correo | email |
| fecha | date |
| hora | time |
| pedido | order |
| producto | product |
| precio | price |
| cantidad | quantity |
| total | total |
| estado | status / state |
| activo | active |
| inactivo | inactive |
| crear | create |
| actualizar | update |
| eliminar | delete |
| buscar | search |
| filtrar | filter |
| ordenar | sort |

## Handling User Requests in Spanish

If the user provides requirements or variable names in Spanish:

1. **Acknowledge** the requirement
2. **Translate** to English
3. **Implement** using English names
4. **Explain** the translation if needed

**Example:**
```
User: "Crea una función para calcular el precio total"

Response: "I'll create a function to calculate the total price:

```python
def calculate_total_price(items: list[Item]) -> float:
    """Calculate the total price for a list of items."""
    return sum(item.price * item.quantity for item in items)
```
```

## Commit Messages

All commit messages must be in English:

✅ Good:
```
feat(auth): add user authentication service
fix(orders): correct total price calculation
docs: update architecture documentation
```

❌ Bad:
```
feat(auth): agregar servicio de autenticación de usuarios
fix(orders): corregir cálculo de precio total
docs: actualizar documentación de arquitectura
```

## Code Review Checklist

When reviewing code, verify:

- [ ] All variable names are in English
- [ ] All function/method names are in English
- [ ] All class names are in English
- [ ] All comments are in English
- [ ] All docstrings are in English
- [ ] All error messages are in English
- [ ] All log messages are in English
- [ ] Spanish is only in Documentation/ or docs/ folders

## Rationale

Writing code in English ensures:
- **International collaboration**: Other developers can understand the code
- **Library compatibility**: Most libraries and frameworks use English
- **Best practices**: English is the standard in software development
- **Maintainability**: Future developers can work with the code
- **Documentation**: Technical documentation is typically in English
