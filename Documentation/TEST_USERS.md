# Test Users (by category)

Users for local E2E and Playwright CLI. Created with `node scripts/create-test-users.mjs`.

**Standard password (all accounts):** `TestPassword123`

---

## Buyer

| Email | Full name | Password |
|-------|-----------|----------|
| `buyer1@test.com` | Comprador Uno | `TestPassword123` |
| `buyer2@test.com` | Comprador Dos | `TestPassword123` |

## Seller (personal)

| Email | Full name | Password |
|-------|-----------|----------|
| `seller1@test.com` | Vendedor Uno | `TestPassword123` |
| `seller2@test.com` | Vendedor Dos | `TestPassword123` |

*These may already exist from DB seed. Set password via `node scripts/set-test-passwords.mjs` or Supabase Studio.*

## Seller (business)

| Email | Full name | Password | Business | Slug |
|-------|-----------|----------|----------|------|
| `business1@test.com` | Ana Negocio | `TestPassword123` | Tienda Electrónica La Paz | tienda-electronica-la-paz |
| `business2@test.com` | Carlos Comercio | `TestPassword123` | Moda Bolivia | moda-bolivia |

---

## Set / reset password

To reset passwords for existing users (e.g. seller1, seller2):

```bash
node scripts/set-test-passwords.mjs
```

Add more emails in `TEST_USER_EMAILS` in that script if needed.
