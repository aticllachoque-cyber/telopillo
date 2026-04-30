-- =============================================================================
-- Seed: Multiple dummy products with image URLs for josefeliciano0.3@test.com
-- Images use https://picsum.photos/seed/... (allowed in next.config dev; stable per seed).
--
-- Run (local Supabase — adjust port if needed):
--   PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f scripts/seed-josefeliciano-dummy-products.sql
--
-- Or from project root:
--   npx supabase db execute --file scripts/seed-josefeliciano-dummy-products.sql
-- =============================================================================

BEGIN;

DO $$
DECLARE
  target_email TEXT := 'josefeliciano0.3@test.com';
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
      'Laptop Dell Inspiron 15 pulgadas RAM 16GB',
      'Laptop Dell Inspiron con procesador Intel i5 de décima generación, 16GB RAM y SSD 512GB. Ideal para trabajo y estudio. Teclado en español, batería con buena autonomía. Incluye cargador original. Entrega en zona céntrica de La Paz.',
      'electronics',
      'Computadoras',
      5200.00,
      'BOB',
      'used_good',
      'La Paz',
      'La Paz',
      ARRAY[
        'https://picsum.photos/seed/jf-jf-el1/800/600',
        'https://picsum.photos/seed/jf-jf-el2/800/600',
        'https://picsum.photos/seed/jf-jf-el3/800/600'
      ]::TEXT[],
      'active',
      NOW() + INTERVAL '90 days'
    ),
    (
      uid,
      'Moto Yamaha FZ 150 cc año 2021 revision al día',
      'Motocicleta Yamaha FZ 150 cc modelo 2021, documentos y revisiones al día. Uso urbano, frenos en buen estado. Incluye casco homologado y maletero trasero. Ideal para desplazamientos diarios en ciudad.',
      'vehicles',
      'Motos',
      11800.00,
      'BOB',
      'used_like_new',
      'La Paz',
      'La Paz',
      ARRAY[
        'https://picsum.photos/seed/jf-jf-v1/800/600',
        'https://picsum.photos/seed/jf-jf-v2/800/600'
      ]::TEXT[],
      'active',
      NOW() + INTERVAL '90 days'
    ),
    (
      uid,
      'Escritorio ergonómico madera roble 140 x 70 cm',
      'Escritorio de trabajo en madera de roble con acabado mate. Medidas 140 x 70 cm, altura estándar. Cajón lateral amplio. Perfecto para home office. Desarmado para fácil transporte dentro de la ciudad.',
      'home',
      'Muebles',
      1450.00,
      'BOB',
      'used_good',
      'La Paz',
      'La Paz',
      ARRAY[
        'https://picsum.photos/seed/jf-jf-h1/800/600',
        'https://picsum.photos/seed/jf-jf-h2/800/600',
        'https://picsum.photos/seed/jf-jf-h3/800/600'
      ]::TEXT[],
      'active',
      NOW() + INTERVAL '90 days'
    ),
    (
      uid,
      'Chaqueta cuero sintético talla L color negro',
      'Chaqueta estilo urbano en cuero sintético, talla L, color negro. Forro interior, cierres metálicos. Usada pocas veces, sin roturas. Abrigo cómodo para noches frías en El Alto o La Paz.',
      'fashion',
      'Ropa',
      320.00,
      'BOB',
      'used_like_new',
      'La Paz',
      'El Alto',
      ARRAY[
        'https://picsum.photos/seed/jf-jf-f1/800/600',
        'https://picsum.photos/seed/jf-jf-f2/800/600'
      ]::TEXT[],
      'active',
      NOW() + INTERVAL '90 days'
    ),
    (
      uid,
      'Set mancuernas ajustables 2 x 20 kg con rack',
      'Set de mancuernas con pesas ajustables hasta 20 kg cada una y soporte metálico. Ideal para gimnasio en casa. Buen agarre antideslizante. Se vende por mudanza; todo revisado y estable.',
      'sports',
      'Gimnasio',
      950.00,
      'BOB',
      'used_good',
      'La Paz',
      'La Paz',
      ARRAY[
        'https://picsum.photos/seed/jf-jf-s1/800/600',
        'https://picsum.photos/seed/jf-jf-s2/800/600'
      ]::TEXT[],
      'active',
      NOW() + INTERVAL '90 days'
    ),
    (
      uid,
      'Libro manual Excel avanzado y análisis de datos',
      'Libro en físico sobre Excel avanzado, tablas dinámicas y visualización de datos. En buen estado de páginas, tapa con uso leve. Ideal para estudiantes y profesionales que quieren automatizar reportes.',
      'books',
      'Educación',
      85.00,
      'BOB',
      'used_good',
      'La Paz',
      'La Paz',
      ARRAY[
        'https://picsum.photos/seed/jf-jf-b1/800/600',
        'https://picsum.photos/seed/jf-jf-b2/800/600',
        'https://picsum.photos/seed/jf-jf-b3/800/600'
      ]::TEXT[],
      'active',
      NOW() + INTERVAL '90 days'
    ),
    (
      uid,
      'Coche para bebé plegable con toldo UV',
      'Coche / cochecito plegable de una mano, toldo con protección UV, arnés de cinco puntos. Ruedas con buen rodaje. Lavado reciente. Idóneo desde recién nacido hasta aprox. 15 kg.',
      'baby',
      'Paseo',
      1100.00,
      'BOB',
      'used_good',
      'La Paz',
      'La Paz',
      ARRAY[
        'https://picsum.photos/seed/jf-jf-bb1/800/600',
        'https://picsum.photos/seed/jf-jf-bb2/800/600'
      ]::TEXT[],
      'active',
      NOW() + INTERVAL '90 days'
    ),
    (
      uid,
      'Juego de construcción 500 piezas compatible bloques',
      'Caja con aproximadamente 500 piezas de construcción compatibles con sistemas populares. Colores variados, piezas y placas base incluidas. Usado en hogar sin humo. Buen estado general.',
      'toys',
      'Construcción',
      240.00,
      'BOB',
      'used_good',
      'La Paz',
      'La Paz',
      ARRAY[
        'https://picsum.photos/seed/jf-jf-t1/800/600',
        'https://picsum.photos/seed/jf-jf-t2/800/600',
        'https://picsum.photos/seed/jf-jf-t3/800/600'
      ]::TEXT[],
      'active',
      NOW() + INTERVAL '90 days'
    ),
    (
      uid,
      'Kit cuidado facial limpieza e hidratación orgánica',
      'Kit completo de rutina facial: limpiador suave, tónico e hidratante con ingredientes de origen vegetal. Sellos sin abrir en tres de cuatro productos; uno abierto con 80% restante. Fechas de caducidad vigentes.',
      'beauty',
      'Cuidado facial',
      180.00,
      'BOB',
      'new',
      'La Paz',
      'La Paz',
      ARRAY[
        'https://picsum.photos/seed/jf-jf-be1/800/600',
        'https://picsum.photos/seed/jf-jf-be2/800/600'
      ]::TEXT[],
      'active',
      NOW() + INTERVAL '90 days'
    ),
    (
      uid,
      'Taladro percutor inalámbrico 18V con dos baterías',
      'Taladro percutor marca reconocida, 18V, con dos baterías Li-ion y cargador rápido. Mandril metálico, luz LED. Uso de bricolaje; funcionamiento verificado. Incluye maletín con brocas básicas.',
      'construction',
      'Herramientas',
      890.00,
      'BOB',
      'used_like_new',
      'La Paz',
      'La Paz',
      ARRAY[
        'https://picsum.photos/seed/jf-jf-c1/800/600',
        'https://picsum.photos/seed/jf-jf-c2/800/600',
        'https://picsum.photos/seed/jf-jf-c3/800/600'
      ]::TEXT[],
      'active',
      NOW() + INTERVAL '90 days'
    );

  RAISE NOTICE 'Inserted 10 dummy products for user % (%)', target_email, uid;
END $$;

COMMIT;
