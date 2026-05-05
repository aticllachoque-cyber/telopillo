-- =============================================================================
-- Seed rich local users and marketplace data.
-- Run:
--   docker exec -i supabase_db_telopillo.com psql -U postgres -d postgres \
--     < scripts/seed-local-rich-users.sql
--
-- Password for every account: TestPassword123
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH seed_users(id, email, full_name, phone, department, city, business_name, business_category) AS (
  VALUES
    ('b1000001-0000-0000-0000-000000000001'::uuid, 'buyer1@test.com', 'Mariela Quispe', '+591 7011 2233', 'La Paz', 'La Paz', NULL, NULL),
    ('b1000001-0000-0000-0000-000000000002'::uuid, 'buyer2@test.com', 'Rodrigo Vargas', '+591 7022 3344', 'Cochabamba', 'Cochabamba', NULL, NULL),
    ('b1000001-0000-0000-0000-000000000003'::uuid, 'seller1@test.com', 'Diego Mamani', '+591 7033 4455', 'Santa Cruz', 'Santa Cruz de la Sierra', NULL, NULL),
    ('b1000001-0000-0000-0000-000000000004'::uuid, 'seller2@test.com', 'Laura Rojas', '+591 7044 5566', 'La Paz', 'El Alto', NULL, NULL),
    ('b1000001-0000-0000-0000-000000000005'::uuid, 'seller3@test.com', 'Valentina Salazar', '+591 7055 6677', 'Tarija', 'Tarija', NULL, NULL),
    ('b1000001-0000-0000-0000-000000000006'::uuid, 'business1@test.com', 'Ana Pereira', '+591 7066 7788', 'La Paz', 'La Paz', 'Tienda Electronica La Paz', 'electronics'),
    ('b1000001-0000-0000-0000-000000000007'::uuid, 'business2@test.com', 'Carlos Rivero', '+591 7077 8899', 'Santa Cruz', 'Santa Cruz de la Sierra', 'Moda Bolivia Express', 'fashion'),
    ('b1000001-0000-0000-0000-000000000008'::uuid, 'business3@test.com', 'Sofia Camacho', '+591 7088 9900', 'Cochabamba', 'Cochabamba', 'Casa Andina Hogar', 'home')
)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  email_change_token_current, reauthentication_token,
  is_sso_user, is_anonymous
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  id,
  'authenticated',
  'authenticated',
  email,
  crypt('TestPassword123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_strip_nulls(jsonb_build_object(
    'full_name', full_name,
    'business_name', business_name,
    'business_category', business_category
  )),
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  '',
  '',
  false,
  false
FROM seed_users
ON CONFLICT (email) WHERE is_sso_user = false DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW()),
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = NOW(),
  confirmation_token = '',
  email_change = '',
  email_change_token_new = '',
  recovery_token = '',
  email_change_token_current = '',
  reauthentication_token = '';

WITH seed_users(email) AS (
  VALUES
    ('buyer1@test.com'), ('buyer2@test.com'), ('seller1@test.com'), ('seller2@test.com'),
    ('seller3@test.com'), ('business1@test.com'), ('business2@test.com'), ('business3@test.com')
)
INSERT INTO auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
SELECT
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users u
JOIN seed_users s ON s.email = u.email
ON CONFLICT (provider_id, provider) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  updated_at = NOW();

WITH seed_users(email, full_name, phone, department, city) AS (
  VALUES
    ('buyer1@test.com', 'Mariela Quispe', '+591 7011 2233', 'La Paz', 'La Paz'),
    ('buyer2@test.com', 'Rodrigo Vargas', '+591 7022 3344', 'Cochabamba', 'Cochabamba'),
    ('seller1@test.com', 'Diego Mamani', '+591 7033 4455', 'Santa Cruz', 'Santa Cruz de la Sierra'),
    ('seller2@test.com', 'Laura Rojas', '+591 7044 5566', 'La Paz', 'El Alto'),
    ('seller3@test.com', 'Valentina Salazar', '+591 7055 6677', 'Tarija', 'Tarija'),
    ('business1@test.com', 'Ana Pereira', '+591 7066 7788', 'La Paz', 'La Paz'),
    ('business2@test.com', 'Carlos Rivero', '+591 7077 8899', 'Santa Cruz', 'Santa Cruz de la Sierra'),
    ('business3@test.com', 'Sofia Camacho', '+591 7088 9900', 'Cochabamba', 'Cochabamba')
)
INSERT INTO public.profiles (
  id, full_name, phone, location_department, location_city,
  rating_average, rating_count, is_verified, verification_level, phone_verified
)
SELECT
  u.id, s.full_name, s.phone, s.department, s.city,
  CASE
    WHEN s.email LIKE 'business%' THEN 4.80
    WHEN s.email LIKE 'seller%' THEN 4.55
    ELSE 0.00
  END,
  CASE
    WHEN s.email LIKE 'business%' THEN 36
    WHEN s.email LIKE 'seller%' THEN 18
    ELSE 0
  END,
  true,
  CASE WHEN s.email LIKE 'business%' THEN 2 ELSE 1 END,
  true
FROM seed_users s
JOIN auth.users u ON u.email = s.email
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  location_department = EXCLUDED.location_department,
  location_city = EXCLUDED.location_city,
  rating_average = EXCLUDED.rating_average,
  rating_count = EXCLUDED.rating_count,
  is_verified = EXCLUDED.is_verified,
  verification_level = EXCLUDED.verification_level,
  phone_verified = EXCLUDED.phone_verified,
  updated_at = NOW();

WITH businesses(email, business_name, slug, category, description, address, department, city, whatsapp) AS (
  VALUES
    ('business1@test.com', 'Tienda Electronica La Paz', 'tienda-electronica-la-paz', 'electronics', 'Celulares, laptops, audio y accesorios con garantia local en La Paz.', 'Av. Camacho 1245, Galeria Central', 'La Paz', 'La Paz', '+59170667788'),
    ('business2@test.com', 'Moda Bolivia Express', 'moda-bolivia-express', 'fashion', 'Ropa, zapatillas y accesorios para entregas rapidas en Santa Cruz.', 'Av. San Martin 220, Equipetrol', 'Santa Cruz', 'Santa Cruz de la Sierra', '+59170778899'),
    ('business3@test.com', 'Casa Andina Hogar', 'casa-andina-hogar', 'home', 'Muebles, cocina y decoracion para departamentos y casas familiares.', 'Calle Ecuador 445', 'Cochabamba', 'Cochabamba', '+59170889900')
)
INSERT INTO public.business_profiles (
  id, business_name, slug, business_category, business_description,
  business_address, business_department, business_city, social_whatsapp,
  business_hours, is_nit_verified
)
SELECT
  u.id, b.business_name, b.slug, b.category, b.description,
  b.address, b.department, b.city, b.whatsapp,
  '{"monday":{"open":"09:00","close":"18:30"},"saturday":{"open":"09:00","close":"13:00"}}'::jsonb,
  true
FROM businesses b
JOIN auth.users u ON u.email = b.email
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  slug = EXCLUDED.slug,
  business_category = EXCLUDED.business_category,
  business_description = EXCLUDED.business_description,
  business_address = EXCLUDED.business_address,
  business_department = EXCLUDED.business_department,
  business_city = EXCLUDED.business_city,
  social_whatsapp = EXCLUDED.social_whatsapp,
  business_hours = EXCLUDED.business_hours,
  is_nit_verified = EXCLUDED.is_nit_verified,
  updated_at = NOW();

WITH product_data(id, email, title, description, category, subcategory, price, condition, department, city, image_seed) AS (
  VALUES
    ('c2000001-0000-0000-0000-000000000001'::uuid, 'seller1@test.com', 'Samsung Galaxy S23 Ultra 256GB impecable', 'Samsung Galaxy S23 Ultra negro en excelente estado, 256GB, bateria cuidada, sin rayones visibles. Incluye cargador, funda y caja original para entrega inmediata.', 'electronics', 'Smartphones', 4800, 'used_like_new', 'Santa Cruz', 'Santa Cruz de la Sierra', 's23-ultra'),
    ('c2000001-0000-0000-0000-000000000002'::uuid, 'seller1@test.com', 'Monitor LG 27 pulgadas 4K para oficina', 'Monitor LG 27 pulgadas 4K IPS con entrada HDMI y USB-C. Ideal para home office, diseno o programacion. Tiene base regulable y cable original.', 'electronics', 'TVs y Audio', 2200, 'used_good', 'Santa Cruz', 'Santa Cruz de la Sierra', 'monitor-lg-4k'),
    ('c2000001-0000-0000-0000-000000000003'::uuid, 'seller1@test.com', 'Bicicleta mountain bike aro 29 aluminio', 'Bicicleta mountain bike aro 29 con cuadro de aluminio, frenos de disco y suspension delantera. Mantenimiento recien hecho y lista para senderos.', 'sports', 'Bicicletas', 1850, 'used_good', 'Santa Cruz', 'Santa Cruz de la Sierra', 'mtb-29'),
    ('c2000001-0000-0000-0000-000000000004'::uuid, 'seller2@test.com', 'Escritorio compacto de madera con cajon', 'Escritorio compacto de madera de 100 cm, perfecto para cuarto pequeno o home office. Tiene cajon lateral, superficie firme y marcas menores de uso.', 'home', 'Muebles', 520, 'used_good', 'La Paz', 'El Alto', 'desk-compact'),
    ('c2000001-0000-0000-0000-000000000005'::uuid, 'seller2@test.com', 'Scooter electrico Xiaomi M365 Pro', 'Scooter electrico Xiaomi M365 Pro con buena autonomia, cargador original y llantas revisadas. Ideal para moverse entre La Paz y El Alto.', 'vehicles', 'Bicicletas', 2450, 'used_good', 'La Paz', 'El Alto', 'scooter-xiaomi'),
    ('c2000001-0000-0000-0000-000000000006'::uuid, 'seller2@test.com', 'Cuna convertible de madera con colchon', 'Cuna convertible a cama infantil, madera firme y colchon incluido. Tiene tres niveles de altura y barandas seguras para recien nacido.', 'baby', 'Muebles Infantiles', 900, 'used_like_new', 'La Paz', 'El Alto', 'cuna-bebe'),
    ('c2000001-0000-0000-0000-000000000007'::uuid, 'seller3@test.com', 'Raqueta Wilson Pro Staff 97 encordada', 'Raqueta Wilson Pro Staff 97 en muy buen estado, encordada y con grip nuevo. Usada en torneos locales, sin fisuras ni golpes estructurales.', 'sports', 'Equipo Deportivo', 780, 'used_good', 'Tarija', 'Tarija', 'wilson-racket'),
    ('c2000001-0000-0000-0000-000000000008'::uuid, 'seller3@test.com', 'Chaqueta de cuero genuino talla M', 'Chaqueta de cuero genuino color marron, talla M, estilo motociclista. Costuras firmes, cierre funcional y cuero bien conservado.', 'fashion', 'Ropa de Hombre', 560, 'used_good', 'Tarija', 'Tarija', 'leather-jacket'),
    ('c2000001-0000-0000-0000-000000000009'::uuid, 'seller3@test.com', 'Soldadora inversora 200A con accesorios', 'Soldadora inversora 200A dual voltage con careta, cables y electrodos. Buena para taller, herreria o trabajos de mantenimiento domestico.', 'construction', 'Herramientas', 1480, 'used_good', 'Tarija', 'Tarija', 'soldadora-200a'),
    ('c2000001-0000-0000-0000-000000000010'::uuid, 'business1@test.com', 'iPhone 14 Pro 128GB desbloqueado', 'iPhone 14 Pro 128GB desbloqueado de fabrica, Face ID perfecto y bateria en buen estado. Incluye caja, cable y garantia de tienda por revision.', 'electronics', 'Smartphones', 5500, 'used_like_new', 'La Paz', 'La Paz', 'iphone-14-pro'),
    ('c2000001-0000-0000-0000-000000000011'::uuid, 'business1@test.com', 'Laptop Lenovo ThinkPad T14 Ryzen 7', 'Laptop Lenovo ThinkPad T14 con Ryzen 7, 16GB RAM y SSD 512GB. Equipo empresarial revisado, teclado excelente y cargador original incluido.', 'electronics', 'Laptops y Computadoras', 4650, 'used_like_new', 'La Paz', 'La Paz', 'thinkpad-t14'),
    ('c2000001-0000-0000-0000-000000000012'::uuid, 'business1@test.com', 'Audifonos Sony WH-1000XM5 nuevos', 'Audifonos Sony WH-1000XM5 sellados, con cancelacion de ruido activa, Bluetooth y estuche original. Producto nuevo con garantia de tienda.', 'electronics', 'TVs y Audio', 1850, 'new', 'La Paz', 'La Paz', 'sony-xm5'),
    ('c2000001-0000-0000-0000-000000000013'::uuid, 'business2@test.com', 'Zapatillas Adidas Ultraboost talla 40', 'Zapatillas Adidas Ultraboost talla 40, color blanco con negro, usadas pocas veces. Suela en excelente estado y plantilla original.', 'fashion', 'Zapatos', 650, 'used_like_new', 'Santa Cruz', 'Santa Cruz de la Sierra', 'ultraboost-40'),
    ('c2000001-0000-0000-0000-000000000014'::uuid, 'business2@test.com', 'Vestido de fiesta elegante color dorado', 'Vestido largo de fiesta color dorado, talla S, usado una sola vez. Tela satinada, caida elegante y cierre en perfecto estado.', 'fashion', 'Ropa de Mujer', 320, 'used_like_new', 'Santa Cruz', 'Santa Cruz de la Sierra', 'vestido-dorado'),
    ('c2000001-0000-0000-0000-000000000015'::uuid, 'business2@test.com', 'Mochila urbana impermeable para laptop', 'Mochila urbana impermeable con compartimento para laptop de 15 pulgadas, bolsillos internos y cierre reforzado. Nueva con etiqueta.', 'fashion', 'Bolsos y Mochilas', 210, 'new', 'Santa Cruz', 'Santa Cruz de la Sierra', 'mochila-laptop'),
    ('c2000001-0000-0000-0000-000000000016'::uuid, 'business3@test.com', 'Juego de ollas Tramontina 7 piezas', 'Set de ollas Tramontina de acero inoxidable, siete piezas, triple fondo y tapas originales. Nuevo en caja para cocina familiar.', 'home', 'Cocina', 1180, 'new', 'Cochabamba', 'Cochabamba', 'ollas-tramontina'),
    ('c2000001-0000-0000-0000-000000000017'::uuid, 'business3@test.com', 'Sillon reclinable individual color gris', 'Sillon reclinable individual tapizado en tela gris, estructura firme y mecanismo suave. Ideal para sala o cuarto de television.', 'home', 'Sala', 1550, 'used_like_new', 'Cochabamba', 'Cochabamba', 'sillon-reclinable'),
    ('c2000001-0000-0000-0000-000000000018'::uuid, 'business3@test.com', 'Refrigeradora Samsung 300L no frost', 'Refrigeradora Samsung 300 litros No Frost, color gris, enfriamiento uniforme y bajo consumo. Revisada, limpia y funcionando perfecto.', 'home', 'Electrodomésticos', 3150, 'used_good', 'Cochabamba', 'Cochabamba', 'refrigeradora-samsung')
)
INSERT INTO public.products (
  id, user_id, title, description, category, subcategory, price, currency,
  condition, location_department, location_city, images, status, expires_at
)
SELECT
  p.id, u.id, p.title, p.description, p.category, p.subcategory, p.price, 'BOB',
  p.condition, p.department, p.city,
  ARRAY[
    'https://picsum.photos/seed/' || p.image_seed || '-1/900/675',
    'https://picsum.photos/seed/' || p.image_seed || '-2/900/675'
  ],
  'active',
  NOW() + INTERVAL '90 days'
FROM product_data p
JOIN auth.users u ON u.email = p.email
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  price = EXCLUDED.price,
  condition = EXCLUDED.condition,
  location_department = EXCLUDED.location_department,
  location_city = EXCLUDED.location_city,
  images = EXCLUDED.images,
  status = 'active',
  updated_at = NOW(),
  expires_at = EXCLUDED.expires_at;

WITH demand_data(id, email, title, description, category, subcategory, department, city, price_min, price_max) AS (
  VALUES
    ('d3000001-0000-0000-0000-000000000001'::uuid, 'buyer1@test.com', 'Busco iPhone 14 o Samsung premium', 'Estoy buscando un celular iPhone 14, iPhone 15 o Samsung premium en buen estado. Prefiero con caja, cargador y bateria saludable.', 'electronics', 'Smartphones', 'La Paz', 'La Paz', 2500, 5800),
    ('d3000001-0000-0000-0000-000000000002'::uuid, 'buyer1@test.com', 'Necesito escritorio compacto para home office', 'Busco escritorio de madera o melamina para cuarto pequeno. Debe estar estable, limpio y tener espacio para laptop y monitor.', 'home', 'Muebles', 'La Paz', 'La Paz', 200, 850),
    ('d3000001-0000-0000-0000-000000000003'::uuid, 'buyer1@test.com', 'Busco ropa de bebe de 0 a 6 meses', 'Necesito bodies, pijamas y gorros para bebe recien nacido. Prefiero algodon, en buen estado o nuevo.', 'baby', 'Ropa de Bebé', 'La Paz', 'El Alto', 50, 250),
    ('d3000001-0000-0000-0000-000000000004'::uuid, 'buyer2@test.com', 'Busco refrigeradora mediana no frost', 'Necesito refrigeradora entre 250 y 350 litros, no frost, funcionando bien y con consumo razonable. Puedo recoger en Cochabamba.', 'home', 'Electrodomésticos', 'Cochabamba', 'Cochabamba', 1500, 3500),
    ('d3000001-0000-0000-0000-000000000005'::uuid, 'buyer2@test.com', 'Necesito laptop para estudiar y trabajar', 'Busco laptop con minimo 16GB de RAM y SSD. La usare para universidad, videollamadas y trabajo de oficina.', 'electronics', 'Laptops y Computadoras', 'Cochabamba', 'Cochabamba', 2500, 5200),
    ('d3000001-0000-0000-0000-000000000006'::uuid, 'buyer2@test.com', 'Busco juego de ollas nuevo o seminuevo', 'Quiero un juego de ollas de acero inoxidable para cocina familiar. Me interesa Tramontina u otra marca resistente.', 'home', 'Cocina', 'Cochabamba', 'Cochabamba', 400, 1300),
    ('d3000001-0000-0000-0000-000000000007'::uuid, 'seller1@test.com', 'Busco silla ergonomica para oficina', 'Necesito silla ergonomica con ruedas y apoyo lumbar. Puede ser usada si esta estable y sin roturas.', 'home', 'Muebles', 'Santa Cruz', 'Santa Cruz de la Sierra', 250, 1200),
    ('d3000001-0000-0000-0000-000000000008'::uuid, 'seller2@test.com', 'Busco zapatillas comodas talla 40', 'Estoy buscando zapatillas comodas talla 40 para caminar todos los dias. Pueden ser Adidas, Nike o similar.', 'fashion', 'Zapatos', 'La Paz', 'El Alto', 150, 700),
    ('d3000001-0000-0000-0000-000000000009'::uuid, 'seller3@test.com', 'Necesito celular Android con buena camara', 'Busco celular Android con buena camara y bateria duradera para fotos de productos. Presupuesto flexible segun modelo.', 'electronics', 'Smartphones', 'Tarija', 'Tarija', 800, 3500),
    ('d3000001-0000-0000-0000-000000000010'::uuid, 'business3@test.com', 'Busco herramientas para mantenimiento', 'Necesito soldadora, amoladora o herramientas electricas para mantenimiento del local. Deben estar funcionando correctamente.', 'construction', 'Herramientas', 'Cochabamba', 'Cochabamba', 400, 2000)
)
INSERT INTO public.demand_posts (
  id, user_id, title, description, category, subcategory,
  location_department, location_city, price_min, price_max, status, expires_at
)
SELECT
  d.id, u.id, d.title, d.description, d.category, d.subcategory,
  d.department, d.city, d.price_min, d.price_max, 'active', NOW() + INTERVAL '30 days'
FROM demand_data d
JOIN auth.users u ON u.email = d.email
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  location_department = EXCLUDED.location_department,
  location_city = EXCLUDED.location_city,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  status = 'active',
  expires_at = EXCLUDED.expires_at,
  updated_at = NOW();

WITH offer_data(demand_id, product_id, message) AS (
  VALUES
    ('d3000001-0000-0000-0000-000000000001'::uuid, 'c2000001-0000-0000-0000-000000000010'::uuid, 'Tengo un iPhone 14 Pro revisado en tienda, con caja y garantia. Podemos coordinar entrega en La Paz.'),
    ('d3000001-0000-0000-0000-000000000001'::uuid, 'c2000001-0000-0000-0000-000000000001'::uuid, 'Tengo un Samsung Galaxy S23 Ultra impecable que entra en tu presupuesto.'),
    ('d3000001-0000-0000-0000-000000000002'::uuid, 'c2000001-0000-0000-0000-000000000004'::uuid, 'Tengo este escritorio compacto en El Alto, ideal para cuarto pequeno.'),
    ('d3000001-0000-0000-0000-000000000003'::uuid, 'c2000001-0000-0000-0000-000000000006'::uuid, 'Tengo una cuna convertible que puede servirte para completar el cuarto del bebe.'),
    ('d3000001-0000-0000-0000-000000000004'::uuid, 'c2000001-0000-0000-0000-000000000018'::uuid, 'Tenemos refrigeradora Samsung no frost revisada y funcionando perfecto en Cochabamba.'),
    ('d3000001-0000-0000-0000-000000000005'::uuid, 'c2000001-0000-0000-0000-000000000011'::uuid, 'Tenemos una ThinkPad T14 con 16GB RAM y SSD, buena para estudio y trabajo.'),
    ('d3000001-0000-0000-0000-000000000006'::uuid, 'c2000001-0000-0000-0000-000000000016'::uuid, 'Tenemos set Tramontina nuevo en caja, listo para entregar en Cochabamba.'),
    ('d3000001-0000-0000-0000-000000000008'::uuid, 'c2000001-0000-0000-0000-000000000013'::uuid, 'Tengo Ultraboost talla 40 en excelente estado.'),
    ('d3000001-0000-0000-0000-000000000009'::uuid, 'c2000001-0000-0000-0000-000000000001'::uuid, 'Este Samsung tiene muy buena camara y bateria cuidada.'),
    ('d3000001-0000-0000-0000-000000000010'::uuid, 'c2000001-0000-0000-0000-000000000009'::uuid, 'Tengo una soldadora inversora completa con accesorios para mantenimiento.')
)
INSERT INTO public.demand_offers (demand_post_id, product_id, seller_id, message)
SELECT
  o.demand_id,
  o.product_id,
  p.user_id,
  o.message
FROM offer_data o
JOIN public.products p ON p.id = o.product_id
JOIN public.demand_posts d ON d.id = o.demand_id
WHERE p.user_id <> d.user_id
ON CONFLICT (demand_post_id, product_id) DO UPDATE SET
  seller_id = EXCLUDED.seller_id,
  message = EXCLUDED.message;

UPDATE public.demand_posts dp
SET offers_count = (
  SELECT count(*)::integer
  FROM public.demand_offers o
  WHERE o.demand_post_id = dp.id
)
WHERE dp.id::text LIKE 'd3000001-%';

COMMIT;
