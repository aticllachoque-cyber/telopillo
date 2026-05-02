-- =============================================================================
-- Seed: sample products + demand posts ("solicitudes") for josefeliciano@test.com
-- Idempotent for this user: removes existing products and demand posts first.
--
-- Run (local Supabase):
--   docker exec -i supabase_db_telopillo.com psql -U postgres -d postgres \
--     -f - < scripts/seed-josefeliciano-at-test-com.sql
-- Or from host with psql:
--   PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
--     -f scripts/seed-josefeliciano-at-test-com.sql
-- =============================================================================

BEGIN;

DO $$
DECLARE
  target_email TEXT := 'josefeliciano@test.com';
  uid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = target_email;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'No auth.users row for email %. Register the account first.', target_email;
  END IF;

  UPDATE public.profiles
  SET
    location_department = COALESCE(NULLIF(trim(location_department), ''), 'La Paz'),
    location_city = COALESCE(NULLIF(trim(location_city), ''), 'La Paz')
  WHERE id = uid;

  DELETE FROM public.demand_posts WHERE user_id = uid;
  DELETE FROM public.products WHERE user_id = uid;

  INSERT INTO public.products (
    user_id,
    title,
    description,
    category,
    subcategory,
    price,
    currency,
    condition,
    location_department,
    location_city,
    images,
    status,
    expires_at
  )
  VALUES
    (
      uid,
      'Monitor LG 27 pulgadas IPS 75Hz para oficina',
      'Monitor LG de 27 pulgadas panel IPS, 75 Hz, resolución Full HD. Cable HDMI incluido. Sin píxeles muertos, uso doméstico cuidado. Ideal para trabajo remoto o estudio. Entrega coordinada en zona sur de La Paz.',
      'electronics',
      'Monitores',
      1650.00,
      'BOB',
      'used_good',
      'La Paz',
      'La Paz',
      ARRAY[
        'https://picsum.photos/seed/jf2-mon1/800/600',
        'https://picsum.photos/seed/jf2-mon2/800/600'
      ]::TEXT[],
      'active',
      NOW() + INTERVAL '90 days'
    ),
    (
      uid,
      'Silla de oficina ergonómica con soporte lumbar ajustable',
      'Silla de oficina con respaldo alto, soporte lumbar regulable y apoyabrazos 4D. Tapizado en tela transpirable. Ruedas silenciosas para piso duro. Armada y lista para usar; se vende por cambio de mobiliario.',
      'home',
      'Muebles',
      2100.00,
      'BOB',
      'used_like_new',
      'La Paz',
      'La Paz',
      ARRAY[
        'https://picsum.photos/seed/jf2-ch1/800/600',
        'https://picsum.photos/seed/jf2-ch2/800/600',
        'https://picsum.photos/seed/jf2-ch3/800/600'
      ]::TEXT[],
      'active',
      NOW() + INTERVAL '90 days'
    ),
    (
      uid,
      'Teclado mecánico compacto 65% switches lineales RGB',
      'Teclado mecánico formato 65 por ciento con switches lineales suaves, iluminación RGB configurable por software. Cable USB-C desmontable. Incluye keycap puller y cable de repuesto. Poco uso, sin desgaste visible.',
      'electronics',
      'Periféricos',
      480.00,
      'BOB',
      'used_like_new',
      'La Paz',
      'El Alto',
      ARRAY[
        'https://picsum.photos/seed/jf2-kb1/800/600',
        'https://picsum.photos/seed/jf2-kb2/800/600'
      ]::TEXT[],
      'active',
      NOW() + INTERVAL '90 days'
    ),
    (
      uid,
      'Aspiradora robot con mapeo láser y base autovaciado',
      'Robot aspirador con navegación láser, programación por app y estación de autovaciado. Filtros recientes, cepillos laterales incluidos. Funciona en pisos duros y alfombra baja. Manual y caja conservados.',
      'home',
      'Electrodomésticos',
      3200.00,
      'BOB',
      'used_good',
      'La Paz',
      'La Paz',
      ARRAY[
        'https://picsum.photos/seed/jf2-rob1/800/600',
        'https://picsum.photos/seed/jf2-rob2/800/600'
      ]::TEXT[],
      'active',
      NOW() + INTERVAL '90 days'
    ),
    (
      uid,
      'Bicicleta urbana aluminio 7 velocidades con luces LED',
      'Bicicleta urbana cuadro aluminio, cambios Shimano 7 velocidades, frenos V-Brake revisados. Incluye luces LED delanteras y traseras, portaequipajes y candado en U. Talla mediana, adecuada para 1.65 a 1.78 m aprox.',
      'sports',
      'Ciclismo',
      1850.00,
      'BOB',
      'used_good',
      'La Paz',
      'La Paz',
      ARRAY[
        'https://picsum.photos/seed/jf2-bik1/800/600',
        'https://picsum.photos/seed/jf2-bik2/800/600',
        'https://picsum.photos/seed/jf2-bik3/800/600'
      ]::TEXT[],
      'active',
      NOW() + INTERVAL '90 days'
    );

  INSERT INTO public.demand_posts (
    user_id,
    title,
    description,
    category,
    location_department,
    location_city,
    price_min,
    price_max,
    status,
    expires_at
  )
  VALUES
    (
      uid,
      'Busco notebook ultraligera para viajes de trabajo',
      'Necesito una laptop ultraligera de 13 o 14 pulgadas con buena batería para viajes frecuentes. Preferible SSD 512 GB o más y mínimo 16 GB RAM. Puede ser usada en buen estado con factura o comprobante.',
      'electronics',
      'La Paz',
      'La Paz',
      3500.00,
      9000.00,
      'active',
      NOW() + INTERVAL '30 days'
    ),
    (
      uid,
      'Necesito refrigerador pequeño o minibar para departamento',
      'Busco refrigerador compacto o minibar para un departamento pequeño, idealmente con congelador pequeño. Consumo eficiente preferido. Puedo retirar en La Paz o El Alto según acuerdo.',
      'home',
      'La Paz',
      'El Alto',
      400.00,
      1800.00,
      'active',
      NOW() + INTERVAL '30 days'
    ),
    (
      uid,
      'Busco curso o mentoría de inglés conversación online',
      'Quiero reforzar inglés conversacional con clases online en horario flexible. Preferencia por enfoque de negocios o presentaciones. Presupuesto mensual acotado; acepto paquetes de 4 a 8 sesiones.',
      'books',
      'La Paz',
      'La Paz',
      200.00,
      800.00,
      'active',
      NOW() + INTERVAL '30 days'
    ),
    (
      uid,
      'Necesito carpa camping 3 personas resistente a viento',
      'Busco carpa para tres personas con buena ventilación y resistencia a viento para campamentos en altura. Doble techo preferido. Puede ser de segunda mano si no tiene roturas ni olor a humedad.',
      'sports',
      'La Paz',
      'La Paz',
      350.00,
      1200.00,
      'active',
      NOW() + INTERVAL '30 days'
    );

  RAISE NOTICE 'Seeded 5 products and 4 demand posts for % (%)', target_email, uid;
END $$;

COMMIT;
