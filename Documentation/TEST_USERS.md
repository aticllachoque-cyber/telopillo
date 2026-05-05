# Test Users

Usuarios locales creados por `scripts/seed-local-rich-users.sql`.

**Password para todas las cuentas:** `TestPassword123`

| Email | Tipo | Nombre | Ubicacion | Datos asociados |
|-------|------|--------|-----------|-----------------|
| `buyer1@test.com` | Comprador | Mariela Quispe | La Paz, La Paz | 3 solicitudes |
| `buyer2@test.com` | Comprador | Rodrigo Vargas | Cochabamba, Cochabamba | 3 solicitudes |
| `seller1@test.com` | Vendedor personal | Diego Mamani | Santa Cruz, Santa Cruz de la Sierra | 3 productos, 1 solicitud |
| `seller2@test.com` | Vendedor personal | Laura Rojas | La Paz, El Alto | 3 productos, 1 solicitud |
| `seller3@test.com` | Vendedor personal | Valentina Salazar | Tarija, Tarija | 3 productos, 1 solicitud |
| `business1@test.com` | Negocio | Ana Pereira | La Paz, La Paz | Tienda Electronica La Paz, 3 productos |
| `business2@test.com` | Negocio | Carlos Rivero | Santa Cruz, Santa Cruz de la Sierra | Moda Bolivia Express, 3 productos |
| `business3@test.com` | Negocio | Sofia Camacho | Cochabamba, Cochabamba | Casa Andina Hogar, 3 productos, 1 solicitud |

Resumen del seed:

- 8 usuarios con perfiles completos
- 3 perfiles de negocio
- 18 productos activos
- 10 solicitudes activas en `/busco`
- 10 ofertas cruzadas entre productos y solicitudes

Para resembrar:

```bash
docker exec -i supabase_db_telopillo.com psql -U postgres -d postgres -f /dev/stdin < scripts/seed-local-rich-users.sql
```
