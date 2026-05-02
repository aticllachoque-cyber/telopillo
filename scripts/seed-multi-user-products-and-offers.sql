-- =============================================================================
-- Seed: products + demand posts + demand_offers for existing auth users
-- Skips users who already have products (does not delete existing rows).
-- Adds sample demands where user has zero demand posts (selected accounts).
-- Inserts cross-user offers (seller product on another user's demand); idempotent
-- on offer pairs via ON CONFLICT DO NOTHING.
--
-- Run:
--   docker exec -i supabase_db_telopillo.com psql -U postgres -d postgres \
--     < scripts/seed-multi-user-products-and-offers.sql
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Two products per user that currently has zero listings
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  slug TEXT;
  img1 TEXT;
  img2 TEXT;
BEGIN
  FOR r IN
    SELECT u.id, u.email
    FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.user_id = u.id)
    ORDER BY u.email
  LOOP
    slug := replace(substring(md5(r.email) from 1 for 12), '/', 'x');

    UPDATE public.profiles
    SET
      location_department = COALESCE(NULLIF(trim(location_department), ''), 'La Paz'),
      location_city = COALESCE(NULLIF(trim(location_city), ''), 'La Paz')
    WHERE id = r.id;

    img1 := format('https://picsum.photos/seed/mu-%s-1/800/600', slug);
    img2 := format('https://picsum.photos/seed/mu-%s-2/800/600', slug);

    INSERT INTO public.products (
      user_id, title, description, category, subcategory, price, currency,
      condition, location_department, location_city, images, status, expires_at
    )
    VALUES
      (
        r.id,
        'Auriculares inalámbricos con cancelación de ruido activa',
        format(
          'Auriculares Bluetooth con estuche de carga USB-C y cancelación de ruido. Batería de larga duración. Cuenta de prueba asociada a %s; producto ficticio para desarrollo y pruebas de listados en Telopillo.',
          r.email
        ),
        'electronics',
        'Audio',
        420.00,
        'BOB',
        'used_good',
        'La Paz',
        'La Paz',
        ARRAY[img1, img2]::TEXT[],
        'active',
        NOW() + INTERVAL '90 days'
      ),
      (
        r.id,
        'Mesa plegable multiuso 120 cm para oficina o estudio',
        format(
          'Mesa plegable resistente de 120 cm de largo, fácil de guardar. Superficie laminada y patas reforzadas. Cuenta de prueba %s; artículo de ejemplo para flujos de marketplace.',
          r.email
        ),
        'home',
        'Muebles',
        680.00,
        'BOB',
        'used_like_new',
        'La Paz',
        'El Alto',
        ARRAY[
          format('https://picsum.photos/seed/mu-%s-3/800/600', slug),
          format('https://picsum.photos/seed/mu-%s-4/800/600', slug)
        ]::TEXT[],
        'active',
        NOW() + INTERVAL '90 days'
      );

    RAISE NOTICE 'Added 2 products for %', r.email;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Demand posts for users that have none (keeps existing demands untouched)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  uid UUID;
BEGIN
  FOR uid IN
    SELECT u.id
    FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM public.demand_posts d WHERE d.user_id = u.id)
      AND u.email IN (
        'dev@telopillo.test',
        'josealejandro01@dev.test.com',
        'josepepito02@test.dev.com',
        'josefeliciano0.3@test.com',
        'reg-cli-1777056174168@telopillo.test',
        'reg-visual-1777056280365@telopillo.test'
      )
  LOOP
    INSERT INTO public.demand_posts (
      user_id, title, description, category,
      location_department, location_city, price_min, price_max, status, expires_at
    )
    VALUES
      (
        uid,
        'Busco celular Android gama media con buena cámara',
        'Necesito un smartphone Android de gama media o alta con buena cámara para fotos diurnas. Preferencia por 128 GB o más y batería duradera. Puede ser usado en buen estado con cargador.',
        'electronics',
        'La Paz',
        'La Paz',
        800.00,
        3500.00,
        'active',
        NOW() + INTERVAL '30 days'
      ),
      (
        uid,
        'Necesito escritorio compacto para espacio reducido',
        'Busco escritorio de hasta 100 cm de ancho para un cuarto pequeño. Preferible con cajón o estante. Puede ser usado si está estable y sin daños estructurales.',
        'home',
        'La Paz',
        'La Paz',
        200.00,
        900.00,
        'active',
        NOW() + INTERVAL '30 days'
      ),
      (
        uid,
        'Busco bicicleta urbana o híbrida para trayectos diarios',
        'Quiero bicicleta urbana o híbrida para desplazamientos diarios en ciudad. Frenos confiables y cuadro talla M aprox. Presupuesto flexible según estado y accesorios.',
        'sports',
        'La Paz',
        'El Alto',
        400.00,
        2500.00,
        'active',
        NOW() + INTERVAL '30 days'
      );

    RAISE NOTICE 'Added 3 demand posts for user %', uid;
  END LOOP;

  FOR uid IN
    SELECT u.id
    FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM public.demand_posts d WHERE d.user_id = u.id)
      AND u.email LIKE 'reg-%@telopillo.test'
      AND u.email NOT IN (
        'reg-cli-1777056174168@telopillo.test',
        'reg-visual-1777056280365@telopillo.test'
      )
  LOOP
    INSERT INTO public.demand_posts (
      user_id, title, description, category,
      location_department, location_city, price_min, price_max, status, expires_at
    )
    VALUES
      (
        uid,
        'Busco monitor usado para trabajo con entrada HDMI',
        'Necesito monitor de 22 a 27 pulgadas con HDMI para home office. Full HD es suficiente. Sin líneas ni píxeles muertos. Puedo retirar en La Paz o alrededores.',
        'electronics',
        'La Paz',
        'La Paz',
        250.00,
        1400.00,
        'active',
        NOW() + INTERVAL '30 days'
      ),
      (
        uid,
        'Necesito silla de oficina básica con ruedas',
        'Busco silla de oficina con ruedas y respaldo ajustable. Uso doméstico. No requiere ser ergonómica premium; que esté estable y limpia.',
        'home',
        'La Paz',
        'La Paz',
        150.00,
        700.00,
        'active',
        NOW() + INTERVAL '30 days'
      );

    RAISE NOTICE 'Added 2 demand posts for reg user %', uid;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Cross-user demand offers (category match, then any product fallback)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  d RECORD;
  pr RECORD;
  n INT;
BEGIN
  FOR d IN
    SELECT id, user_id, category
    FROM public.demand_posts
    WHERE status = 'active' AND expires_at > NOW()
  LOOP
    n := 0;
    FOR pr IN
      SELECT p.id, p.user_id
      FROM public.products p
      WHERE p.status = 'active'
        AND p.user_id <> d.user_id
        AND p.category = d.category
      ORDER BY p.created_at DESC
      LIMIT 3
    LOOP
      INSERT INTO public.demand_offers (demand_post_id, product_id, seller_id, message)
      VALUES (
        d.id,
        pr.id,
        pr.user_id,
        'Hola, tengo este artículo publicado y encaja con lo que buscas. Coordinamos entrega cuando te venga bien.'
      )
      ON CONFLICT (demand_post_id, product_id) DO NOTHING;
      n := n + 1;
    END LOOP;

    IF n = 0 THEN
      FOR pr IN
        SELECT p.id, p.user_id
        FROM public.products p
        WHERE p.status = 'active' AND p.user_id <> d.user_id
        ORDER BY p.created_at DESC
        LIMIT 2
      LOOP
        INSERT INTO public.demand_offers (demand_post_id, product_id, seller_id, message)
        VALUES (
          d.id,
          pr.id,
          pr.user_id,
          'Te dejo esta opción por si te sirve; puedo ampliar detalles o fotos si quieres.'
        )
        ON CONFLICT (demand_post_id, product_id) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4) Reconcile offers_count with actual rows (safe if trigger already correct)
-- ---------------------------------------------------------------------------
UPDATE public.demand_posts dp
SET offers_count = (SELECT count(*)::INTEGER FROM public.demand_offers o WHERE o.demand_post_id = dp.id);

COMMIT;
