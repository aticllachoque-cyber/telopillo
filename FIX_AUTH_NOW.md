# 🔧 FIX URGENTE: Database error querying schema

## ⚡ Ejecuta AHORA en Supabase Dashboard

### 1️⃣ Abre Supabase SQL Editor:
👉 https://supabase.com/dashboard/project/apwpsjjzcbytnvtnmmru/sql/new

### 2️⃣ Copia y pega este SQL:

```sql
-- Fix "Database error querying schema"
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE
  confirmation_token IS NULL
  OR email_change IS NULL
  OR email_change_token_new IS NULL
  OR recovery_token IS NULL;

-- Verificar el fix
SELECT 
  id, 
  email,
  confirmation_token = '' AS confirmation_ok,
  email_change = '' AS email_change_ok,
  recovery_token = '' AS recovery_ok
FROM auth.users
WHERE email = 'dev@telopillo.test';
```

### 3️⃣ Click "RUN" o presiona Ctrl+Enter

### 4️⃣ Deberías ver:
```
UPDATE 4  (o el número de usuarios que tengas)
```

### 5️⃣ Prueba el login:
- URL: http://localhost:3000/login
- Email: `dev@telopillo.test`
- Password: `DevTest123`

---

## ✅ Después del fix:

El login debería funcionar correctamente y podrás:
- ✅ Ver tu perfil en `/profile`
- ✅ Editar tu perfil en `/profile/edit`
- ✅ Seleccionar departamento y ciudad
- ✅ Guardar cambios

---

## 🐛 ¿Qué causó este bug?

Los usuarios creados manualmente en Supabase tienen columnas de tokens con `NULL` en lugar de strings vacíos (`''`). Supabase Auth no puede procesar NULL en estas columnas.

**Columnas afectadas:**
- `confirmation_token`
- `email_change`
- `email_change_token_new`
- `recovery_token`

**Referencia:** https://github.com/supabase/auth/issues/1940
