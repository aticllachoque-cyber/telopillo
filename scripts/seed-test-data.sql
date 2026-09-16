-- Test seed data: personas, negocios y productos for manual/E2E testing of
-- unified search (/buscar tabs, header selector) on the LOCAL dev database.
--
-- Apply: docker exec -i supabase_db_telopillo.com psql -U postgres -d postgres < scripts/seed-test-data.sql
-- Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING.
--
-- Test accounts (password: password123):
--   marcela.claros@telopillo.test  -> Feria Verde Organicos (negocio)
--   ivan.patino@telopillo.test     -> TecnoService Reparaciones (negocio)
--   gabriela.ortiz@telopillo.test  -> Muebles El Roble (negocio)
--   rodrigo.salazar@telopillo.test -> vendedor personal (deportes)
--   camila.vargas@telopillo.test   -> vendedora personal (belleza)
--   tomas.rojas@telopillo.test     -> vendedor personal (libros/juguetes)
--   maria.blanco@telopillo.test    -> SIN productos activos (no aparece en Personas)

-- =============================================================================
-- 1. auth.users (id = profiles.id, same pattern as the b1000001... seed batch)
-- NOTE: this local GoTrue build requires instance_id, role/aud and empty token
-- columns — omitting any of them yields "Invalid login credentials".
-- =============================================================================
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change, phone_change_token)
VALUES
  ('c3000001-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marcela.claros@telopillo.test', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marcela Claros"}', '', '', '', '', ''),
  ('c3000001-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ivan.patino@telopillo.test', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ivan Patino"}', '', '', '', '', ''),
  ('c3000001-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gabriela.ortiz@telopillo.test', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Gabriela Ortiz"}', '', '', '', '', ''),
  ('c3000001-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rodrigo.salazar@telopillo.test', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rodrigo Salazar"}', '', '', '', '', ''),
  ('c3000001-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'camila.vargas@telopillo.test', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Camila Vargas"}', '', '', '', '', ''),
  ('c3000001-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tomas.rojas@telopillo.test', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tomas Rojas"}', '', '', '', '', ''),
  ('c3000001-0000-0000-0000-000000000007'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'maria.blanco@telopillo.test', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Maria Blanco"}', '', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- auth.identities (email provider link; required for login)
-- NOTE: email is a generated column in this auth schema version — not inserted.
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT u.id, u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
FROM auth.users u
WHERE u.id::text LIKE 'c3000001-%'
ON CONFLICT (provider_id, provider) DO NOTHING;

-- =============================================================================
-- 2. profiles
-- =============================================================================
INSERT INTO public.profiles (id, full_name, phone, location_city, location_department, rating_average, rating_count, is_verified, account_type, verification_level, onboarding_completed)
VALUES
  ('c3000001-0000-0000-0000-000000000001'::uuid, 'Marcela Claros', '+591 70111222', 'Cochabamba', 'Cochabamba', 4.80, 21, true, 'business', 2, true),
  ('c3000001-0000-0000-0000-000000000002'::uuid, 'Ivan Patino', '+591 70222333', 'Santa Cruz de la Sierra', 'Santa Cruz', 4.50, 14, true, 'business', 1, true),
  ('c3000001-0000-0000-0000-000000000003'::uuid, 'Gabriela Ortiz', '+591 70333444', 'La Paz', 'La Paz', 4.90, 33, true, 'business', 2, true),
  ('c3000001-0000-0000-0000-000000000004'::uuid, 'Rodrigo Salazar', '+591 70444555', 'La Paz', 'La Paz', 4.20, 8, false, 'personal', 1, true),
  ('c3000001-0000-0000-0000-000000000005'::uuid, 'Camila Vargas', '+591 70555666', 'Santa Cruz de la Sierra', 'Santa Cruz', 4.60, 17, false, 'personal', 0, true),
  ('c3000001-0000-0000-0000-000000000006'::uuid, 'Tomas Rojas', NULL, 'Quillacollo', 'Cochabamba', 3.90, 5, false, 'personal', 0, true),
  ('c3000001-0000-0000-0000-000000000007'::uuid, 'Maria Blanco', NULL, 'Tarija', 'Tarija', 0.00, 0, false, 'personal', 0, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. business_profiles (search_vector is generated; RLS select = true)
-- =============================================================================
INSERT INTO public.business_profiles (id, business_name, slug, business_description, business_category, nit, business_department, business_city, business_address, is_nit_verified, social_whatsapp, business_hours)
VALUES
  ('c3000001-0000-0000-0000-000000000001'::uuid, 'Feria Verde Organicos', 'feria-verde-organicos',
   'Productos organicos y agroecologicos directo de productores de Cochabamba. Bolsones semanales, miel, quinua y cafe de altura.',
   'Alimentos', '1025634015', 'Cochabamba', 'Cochabamba', 'Av. America #456', true, '59170111222',
   '{"lun-vie":["08:00","18:00"],"sab":["08:00","13:00"]}'),
  ('c3000001-0000-0000-0000-000000000002'::uuid, 'TecnoService Reparaciones', 'tecnoservice-reparaciones',
   'Servicio tecnico de celulares y computadoras en Santa Cruz. Reparacion de pantallas, baterias, microsoldadura y recuperacion de datos.',
   'Servicios', '4589632100', 'Santa Cruz', 'Santa Cruz de la Sierra', 'Calle Sucre #789', true, '59170222333',
   '{"lun-sab":["09:00","19:00"]}'),
  ('c3000001-0000-0000-0000-000000000003'::uuid, 'Muebles El Roble', 'muebles-el-roble',
   'Fabrica de muebles de madera maciza en La Paz. Dormitorios,Living, comedores y muebles a medida con madera de roble y cedro.',
   'Hogar y Jardin', '7894561230', 'La Paz', 'La Paz', 'Av. Buenos Aires #123', true, '59170333444',
   '{"lun-vie":["09:00","18:30"],"sab":["09:00","14:00"]}')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. products (search_vector via trigger; requires >=1 image, title 10-100,
--    description 50-5000, status in active|sold|inactive|deleted)
-- products has no natural key, so the whole VALUES set is skipped if any
-- c3000001 product already exists (keeps the script idempotent).
-- =============================================================================
INSERT INTO public.products (user_id, title, description, category, subcategory, price, currency, condition, location_department, location_city, images, status, views_count)
SELECT * FROM (VALUES
  -- Feria Verde Organicos (Marcela)
  ('c3000001-0000-0000-0000-000000000001'::uuid, 'Bolson organico semanal de verduras',
   'Bolson con 8 a 10 variedades de verduras frescas de productores agroecologicos del valle bajo. Cosecha de la semana, entrega los sabados.',
   'home', 'alimentos', 85.00, 'BOB', 'new', 'Cochabamba', 'Cochabamba',
   ARRAY['https://picsum.photos/seed/bolson-verde-1/900/675','https://picsum.photos/seed/bolson-verde-2/900/675'], 'active', 42),
  ('c3000001-0000-0000-0000-000000000001'::uuid, 'Miel pura de abeja 1 kg del valle',
   'Miel multifloral cruda sin procesar, cosechada en apiarios del valle de Cochabamba. Ideal para el frio, endulzante natural con propiedades.',
   'home', 'alimentos', 65.00, 'BOB', 'new', 'Cochabamba', 'Cochabamba',
   ARRAY['https://picsum.photos/seed/miel-1kg-1/900/675'], 'active', 30),
  ('c3000001-0000-0000-0000-000000000001'::uuid, 'Cafe de altura molido medio kilo',
   'Cafe arabiga de altura tostado artesanalmente, notas a chocolate y naranja. Molido para filtro o embolo, produccion limitada de Yungas.',
   'home', 'alimentos', 95.00, 'BOB', 'new', 'Cochabamba', 'Cochabamba',
   ARRAY['https://picsum.photos/seed/cafe-altura-1/900/675','https://picsum.photos/seed/cafe-altura-2/900/675'], 'active', 51),

  -- TecnoService Reparaciones (Ivan)
  ('c3000001-0000-0000-0000-000000000002'::uuid, 'Servicio de cambio de pantalla celular',
   'Cambio de pantalla de celular con repuesto original o premium segun modelo. Incluye mano de obra y garantia de 3 meses por el trabajo.',
   'electronics', 'servicios', 180.00, 'BOB', 'new', 'Santa Cruz', 'Santa Cruz de la Sierra',
   ARRAY['https://picsum.photos/seed/pantalla-serv-1/900/675'], 'active', 88),
  ('c3000001-0000-0000-0000-000000000002'::uuid, 'Limpieza interna laptop con cambio pasta',
   'Mantenimiento completo de laptop: limpieza interna, cambio de pasta termica y revision de ventiladores. Entrega en 24 horas con diagnostico.',
   'electronics', 'servicios', 120.00, 'BOB', 'new', 'Santa Cruz', 'Santa Cruz de la Sierra',
   ARRAY['https://picsum.photos/seed/laptop-limp-1/900/675'], 'active', 64),
  ('c3000001-0000-0000-0000-000000000002'::uuid, 'Recuperacion de datos disco duro o SSD',
   'Recuperacion de datos de discos duros, SSD y memorias USB. Diagnostico sin costo, presupuestamos antes de recuperar cualquier archivo.',
   'electronics', 'servicios', 250.00, 'BOB', 'new', 'Santa Cruz', 'Santa Cruz de la Sierra',
   ARRAY['https://picsum.photos/seed/data-rec-1/900/675'], 'active', 39),

  -- Muebles El Roble (Gabriela)
  ('c3000001-0000-0000-0000-000000000003'::uuid, 'Dormitorio roble macizo 2 plazas completo',
   'Dormitorio de madera de roble macizo: cama 2 plazas, 2 veladores y comoda. Acabado barnizado mate, herrajes de primera, fabricacion local.',
   'home', 'dormitorio', 4800.00, 'BOB', 'new', 'La Paz', 'La Paz',
   ARRAY['https://picsum.photos/seed/roble-dorm-1/900/675','https://picsum.photos/seed/roble-dorm-2/900/675'], 'active', 120),
  ('c3000001-0000-0000-0000-000000000003'::uuid, 'Comedor 6 sillas cedro artesanal',
   'Comedor de madera de cedro con mesa de 1.60 m y 6 sillas tapizadas. Diseno clasico, ideal para comedor familiar, entrega en La Paz incluida.',
   'home', 'comedor', 3500.00, 'BOB', 'new', 'La Paz', 'La Paz',
   ARRAY['https://picsum.photos/seed/cdoba-cedro-1/900/675'], 'active', 75),
  ('c3000001-0000-0000-0000-000000000003'::uuid, 'Estante librero roble 5 niveles',
   'Librero de roble macizo de 5 niveles, ideal para oficina o sala. Medidas 1.80 x 0.90 m, soporta enciclopedias, acabado ceralacca natural.',
   'home', 'estantes', 1450.00, 'BOB', 'new', 'La Paz', 'La Paz',
   ARRAY['https://picsum.photos/seed/librero-roble-1/900/675'], 'sold', 96),

  -- Rodrigo Salazar (personal, deportes)
  ('c3000001-0000-0000-0000-000000000004'::uuid, 'Bicicleta urbana rodada 27.5 con cambios',
   'Bicicleta urbana rodada 27.5, cuadro de aluminio, 21 velocidades Shimano. Frenos v-brake nuevos, lista para rodar por el malecon o ciclovias.',
   'sports', 'bikes', 900.00, 'BOB', 'used_good', 'La Paz', 'La Paz',
   ARRAY['https://picsum.photos/seed/bici-urbana-1/900/675'], 'active', 20),
  ('c3000001-0000-0000-0000-000000000004'::uuid, 'Set de pesas ajustable 40 kg total',
   'Set de pesas cromadas con barras y discos ajustables hasta 40 kg en total. Poco uso, incluye mancuernas cortas y barras largas con seguros.',
   'sports', 'gym', 750.00, 'BOB', 'used_like_new', 'La Paz', 'La Paz',
   ARRAY['https://picsum.photos/seed/pesas-40k-1/900/675','https://picsum.photos/seed/pesas-40k-2/900/675'], 'active', 33),
  ('c3000001-0000-0000-0000-000000000004'::uuid, 'Tabla skateboard completa importada',
   'Skateboard completa con tabla de arce canadiense, ejes de aluminio y ruedas 52mm. Rodada pocas veces, lija nueva puesta recientemente.',
   'sports', 'skate', 320.00, 'BOB', 'used_good', 'La Paz', 'La Paz',
   ARRAY['https://picsum.photos/seed/skate-comp-1/900/675'], 'active', 15),

  -- Camila Vargas (personal, belleza)
  ('c3000001-0000-0000-0000-000000000005'::uuid, 'Secadora de pelo profesional 2200W',
   'Secadora profesional de 2200 watts con ionizador, 3 niveles de calor y 2 de velocidad. Incluye difusor y concentrador, casi nueva.',
   'beauty', 'electro', 280.00, 'BOB', 'used_like_new', 'Santa Cruz', 'Santa Cruz de la Sierra',
   ARRAY['https://picsum.photos/seed/secadora-1/900/675'], 'active', 27),
  ('c3000001-0000-0000-0000-000000000005'::uuid, 'Kit plancha y rulera ceramica 2 en 1',
   'Kit de plancha alisadora y rulera de ceramica para el cabello, temperatura regulable. Usadas pocas veces, incluyen caja y manuales originales.',
   'beauty', 'electro', 210.00, 'BOB', 'used_good', 'Santa Cruz', 'Santa Cruz de la Sierra',
   ARRAY['https://picsum.photos/seed/plancha-kit-1/900/675'], 'active', 19),
  ('c3000001-0000-0000-0000-000000000005'::uuid, 'Lote cosmeticos makeup nuevos surtidos',
   'Lote de cosmeticos nuevos: labiales, sombras, rubores y rimel de marcas importadas. Ideal para revender o regalo, todo sellado en su empaque.',
   'beauty', 'maquillaje', 150.00, 'BOB', 'new', 'Santa Cruz', 'Santa Cruz de la Sierra',
   ARRAY['https://picsum.photos/seed/makeup-lote-1/900/675','https://picsum.photos/seed/makeup-lote-2/900/675'], 'inactive', 8),

  -- Tomas Rojas (personal, libros/juguetes)
  ('c3000001-0000-0000-0000-000000000006'::uuid, 'Coleccion Harry Potter 7 libros tapa dura',
   'Coleccion completa de Harry Potter en tapa dura, editorial salamandra. Los 7 libros en buen estado, sin paginas marcadas ni hojas sueltas.',
   'books', 'libros', 480.00, 'BOB', 'used_good', 'Cochabamba', 'Quillacollo',
   ARRAY['https://picsum.photos/seed/hp-colec-1/900/675'], 'active', 44),
  ('c3000001-0000-0000-0000-000000000006'::uuid, 'Pista de autos electrica con 2 autos',
   'Pista de autos electrica con 2 autos a control, rieles de 6 metros y transformador. Juguete para ninos de 5 anos en adelante, funciona bien.',
   'toys', 'juegos', 260.00, 'BOB', 'used_good', 'Cochabamba', 'Quillacollo',
   ARRAY['https://picsum.photos/seed/pista-autos-1/900/675'], 'active', 22)
) AS seed(user_id, title, description, category, subcategory, price, currency, condition, location_department, location_city, images, status, views_count)
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE user_id::text LIKE 'c3000001-%');

-- Verification counts
SELECT 'users' AS what, count(*) FROM auth.users WHERE id::text LIKE 'c3000001-%'
UNION ALL SELECT 'profiles', count(*) FROM profiles WHERE id::text LIKE 'c3000001-%'
UNION ALL SELECT 'businesses', count(*) FROM business_profiles WHERE id::text LIKE 'c3000001-%'
UNION ALL SELECT 'products', count(*) FROM products WHERE user_id::text LIKE 'c3000001-%';
