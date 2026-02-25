-- =============================================================================
-- Seed: Products (~40) from multiple users + Demand Offers
-- Run: PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f scripts/seed-products-and-offers.sql
-- =============================================================================

BEGIN;

-- User IDs for reference:
--   carlos   = '644f21fe-2e62-49eb-9fda-5f1f9b7144f3'
--   laura    = '9f2a22c7-ddfc-4ebd-ad0a-b5cfaeb3ab9e'
--   maria    = 'a1000001-0000-0000-0000-000000000001'
--   diego    = 'a1000001-0000-0000-0000-000000000002'
--   ana      = 'a1000001-0000-0000-0000-000000000003'
--   roberto  = 'a1000001-0000-0000-0000-000000000004'
--   valentina= 'a1000001-0000-0000-0000-000000000005'

-- =============================================================================
-- 1. Update profiles with locations (needed for realistic products)
-- =============================================================================

UPDATE profiles SET location_department = 'La Paz', location_city = 'La Paz'
  WHERE id = 'a1000001-0000-0000-0000-000000000001';
UPDATE profiles SET location_department = 'Santa Cruz', location_city = 'Santa Cruz de la Sierra'
  WHERE id = 'a1000001-0000-0000-0000-000000000002';
UPDATE profiles SET location_department = 'Cochabamba', location_city = 'Cochabamba'
  WHERE id = 'a1000001-0000-0000-0000-000000000003';
UPDATE profiles SET location_department = 'Tarija', location_city = 'Tarija'
  WHERE id = 'a1000001-0000-0000-0000-000000000004';
UPDATE profiles SET location_department = 'Oruro', location_city = 'Oruro'
  WHERE id = 'a1000001-0000-0000-0000-000000000005';
UPDATE profiles SET location_department = 'La Paz', location_city = 'El Alto'
  WHERE id = '9f2a22c7-ddfc-4ebd-ad0a-b5cfaeb3ab9e';
UPDATE profiles SET location_department = 'Santa Cruz', location_city = 'Montero'
  WHERE id = '644f21fe-2e62-49eb-9fda-5f1f9b7144f3';

-- =============================================================================
-- 2. Products (diverse categories, users, locations, conditions)
-- =============================================================================

-- ── ELECTRONICS ──────────────────────────────────────────────────────────────

INSERT INTO products (id, user_id, title, description, category, subcategory, price, currency, condition, location_department, location_city, images, status, expires_at)
VALUES
  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000001', 'Samsung Galaxy S23 Ultra 256GB',
   'Samsung Galaxy S23 Ultra en perfecto estado. 256GB, color negro. Batería al 92%. Incluye cargador original y estuche. Sin rayones.',
   'electronics', 'Celulares', 4800, 'BOB', 'used_like_new', 'La Paz', 'La Paz', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000002', 'iPhone 14 Pro 128GB desbloqueado',
   'iPhone 14 Pro desbloqueado de fábrica. 128GB, color morado. Batería al 89%. Con caja original y todos los accesorios. Face ID perfecto.',
   'electronics', 'Celulares', 5500, 'BOB', 'used_good', 'Santa Cruz', 'Santa Cruz de la Sierra', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000003', 'Monitor LG 27 pulgadas 4K IPS',
   'Monitor LG 27UK850 4K IPS. Excelente para diseño y edición. USB-C con carga. HDR10. Con caja original.',
   'electronics', 'Monitores', 2200, 'BOB', 'used_good', 'Cochabamba', 'Cochabamba', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000004', 'Audífonos Sony WH-1000XM5 nuevos',
   'Audífonos Sony WH-1000XM5 sellados, sin abrir. Cancelación de ruido líder. Bluetooth 5.2. Color negro.',
   'electronics', 'Audio', 1800, 'BOB', 'new', 'Tarija', 'Tarija', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000005', 'Tablet iPad Air 5ta generación 64GB',
   'iPad Air M1 64GB WiFi. Color azul. Con Apple Pencil 2da gen incluido. Perfecto para estudiantes y diseñadores.',
   'electronics', 'Tablets', 3500, 'BOB', 'used_like_new', 'Oruro', 'Oruro', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), '9f2a22c7-ddfc-4ebd-ad0a-b5cfaeb3ab9e', 'Parlante JBL Charge 5 original',
   'JBL Charge 5 original, resistente al agua IP67. 20 horas de batería. Sonido potente para fiestas. Color rojo.',
   'electronics', 'Audio', 900, 'BOB', 'used_good', 'La Paz', 'El Alto', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000001', 'Cámara Canon EOS R50 con lente kit',
   'Canon EOS R50 mirrorless con lente 18-45mm. 24.2MP, video 4K. Ideal para principiantes y creadores de contenido. Incluye bolso.',
   'electronics', 'Cámaras', 4200, 'BOB', 'new', 'La Paz', 'La Paz', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000002', 'Smart TV Samsung 55 pulgadas Crystal UHD',
   'Samsung Crystal UHD 55 pulgadas 4K. Smart TV con Tizen. Apenas 6 meses de uso. Con control remoto y caja original.',
   'electronics', 'Televisores', 3800, 'BOB', 'used_like_new', 'Santa Cruz', 'Santa Cruz de la Sierra', '{}', 'active', NOW() + INTERVAL '30 days'),

-- ── VEHICLES ─────────────────────────────────────────────────────────────────

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000002', 'Honda CB190R 2022 como nueva',
   'Honda CB190R modelo 2022, 3000km. Color negro. Al día con papeles y SOAT. Perfecta para ciudad y delivery.',
   'vehicles', 'Motos', 12000, 'BOB', 'used_like_new', 'Santa Cruz', 'Santa Cruz de la Sierra', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000004', 'Bicicleta Oxford Merak aro 27.5',
   'Bicicleta Oxford Merak aro 27.5, 21 velocidades. Frenos de disco mecánicos. Usada pero en excelente estado. Ideal para cerros.',
   'vehicles', 'Bicicletas', 1800, 'BOB', 'used_good', 'Tarija', 'Tarija', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), '9f2a22c7-ddfc-4ebd-ad0a-b5cfaeb3ab9e', 'Scooter eléctrico Xiaomi M365 Pro',
   'Scooter eléctrico Xiaomi M365 Pro. 45km de autonomía, velocidad máxima 25km/h. Perfecto para El Alto. Incluye casco.',
   'vehicles', 'Scooters', 2500, 'BOB', 'used_good', 'La Paz', 'El Alto', '{}', 'active', NOW() + INTERVAL '30 days'),

-- ── FASHION ──────────────────────────────────────────────────────────────────

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000003', 'Chompa Columbia fleece talla L nueva',
   'Chompa Columbia de polar fleece, talla L. Color azul marino. Nueva con etiquetas. Perfecta para el frío de Cochabamba.',
   'fashion', 'Ropa', 350, 'BOB', 'new', 'Cochabamba', 'Cochabamba', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000005', 'Zapatillas Adidas Ultraboost 22 talla 40',
   'Adidas Ultraboost 22, talla 40. Color blanco con negro. Usadas solo 3 veces. Comodísimas para caminar o correr.',
   'fashion', 'Calzado', 650, 'BOB', 'used_like_new', 'Oruro', 'Oruro', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000001', 'Chaqueta de cuero genuino talla M',
   'Chaqueta de cuero genuino color marrón, talla M. Estilo motociclista. Excelente estado, sin marcas ni roturas.',
   'fashion', 'Ropa', 500, 'BOB', 'used_good', 'La Paz', 'La Paz', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000002', 'Vestido de fiesta elegante talla S',
   'Vestido largo de fiesta color dorado, talla S. Usado una sola vez para graduación. Tela satinada de excelente calidad.',
   'fashion', 'Ropa', 280, 'BOB', 'used_like_new', 'Santa Cruz', 'Santa Cruz de la Sierra', '{}', 'active', NOW() + INTERVAL '30 days'),

-- ── HOME ─────────────────────────────────────────────────────────────────────

  (gen_random_uuid(), '9f2a22c7-ddfc-4ebd-ad0a-b5cfaeb3ab9e', 'Escritorio de madera para home office',
   'Escritorio de madera maciza 120x60cm. Con cajones laterales. Ideal para home office. Muy resistente y bonito.',
   'home', 'Muebles', 800, 'BOB', 'used_good', 'La Paz', 'El Alto', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000003', 'Juego de ollas tramontina 7 piezas',
   'Set de ollas Tramontina Professional de acero inoxidable, 7 piezas. Triple fondo. Nuevas en caja sellada.',
   'home', 'Cocina', 1200, 'BOB', 'new', 'Cochabamba', 'Cochabamba', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000004', 'Colchón Paraiso matrimonial resortes',
   'Colchón Paraiso de resortes ensacados, tamaño matrimonial (140x190). Apenas 1 año de uso. Muy cómodo, sin manchas.',
   'home', 'Dormitorio', 1500, 'BOB', 'used_good', 'Tarija', 'Tarija', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000001', 'Refrigeradora Samsung 300L no frost',
   'Samsung refrigeradora 300 litros No Frost. Color gris. 2 años de uso, funciona perfecto. Dispensador de agua.',
   'home', 'Electrodomésticos', 3200, 'BOB', 'used_good', 'La Paz', 'La Paz', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000005', 'Estufa a gas industrial 6 hornillas',
   'Estufa industrial de 6 hornillas a gas. Marca Fagor. Ideal para restaurante o negocio de comida. Con horno incorporado.',
   'home', 'Cocina', 2800, 'BOB', 'used_good', 'Oruro', 'Oruro', '{}', 'active', NOW() + INTERVAL '30 days'),

-- ── SPORTS ───────────────────────────────────────────────────────────────────

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000002', 'Mancuernas hexagonales 5-20kg set completo',
   'Set de mancuernas hexagonales de 5kg a 20kg (pares). Con rack incluido. Perfectas para gimnasio en casa.',
   'sports', 'Gimnasio', 2200, 'BOB', 'new', 'Santa Cruz', 'Santa Cruz de la Sierra', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000004', 'Raqueta de tenis Wilson Pro Staff 97',
   'Wilson Pro Staff 97 v13. Encordada con Luxilon ALU Power. Usada en torneos locales pero en excelente estado.',
   'sports', 'Tenis', 800, 'BOB', 'used_good', 'Tarija', 'Tarija', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000003', 'Pelota de fútbol Adidas Al Rihla oficial',
   'Adidas Al Rihla, pelota oficial del Mundial 2022. Nueva, sin uso. Con bomba de aire incluida.',
   'sports', 'Fútbol', 350, 'BOB', 'new', 'Cochabamba', 'Cochabamba', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), '9f2a22c7-ddfc-4ebd-ad0a-b5cfaeb3ab9e', 'Bicicleta de spinning profesional',
   'Bicicleta de spinning marca Randers, volante de inercia 18kg. Monitor LCD. Perfecta para ejercicio en casa.',
   'sports', 'Gimnasio', 1800, 'BOB', 'used_good', 'La Paz', 'El Alto', '{}', 'active', NOW() + INTERVAL '30 days'),

-- ── CONSTRUCTION ─────────────────────────────────────────────────────────────

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000004', 'Amoladora angular DeWalt 9 pulgadas',
   'DeWalt DWE4559 amoladora angular de 9 pulgadas, 2200W. Para trabajos pesados en concreto y metal. Como nueva.',
   'construction', 'Herramientas', 750, 'BOB', 'used_like_new', 'Tarija', 'Tarija', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000002', 'Soldadora inversora Lincoln 200A',
   'Lincoln Electric soldadora inversora 200A. Dual voltage 110/220V. Con careta, electrodos y cables. Seminueva.',
   'construction', 'Herramientas', 1500, 'BOB', 'used_good', 'Santa Cruz', 'Santa Cruz de la Sierra', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), '9f2a22c7-ddfc-4ebd-ad0a-b5cfaeb3ab9e', 'Escalera telescópica aluminio 4.5m',
   'Escalera telescópica de aluminio plegable, extiende hasta 4.5 metros. Muy práctica para trabajos en altura. Soporta 150kg.',
   'construction', 'Herramientas', 600, 'BOB', 'used_good', 'La Paz', 'El Alto', '{}', 'active', NOW() + INTERVAL '30 days'),

-- ── BOOKS ────────────────────────────────────────────────────────────────────

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000003', 'Libros de medicina Guyton Fisiología 14ed',
   'Guyton y Hall Tratado de Fisiología Médica 14ta edición. En español. Perfecto estado, solo subrayado a lápiz.',
   'books', 'Libros de Texto', 250, 'BOB', 'used_good', 'Cochabamba', 'Cochabamba', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000005', 'Pack 5 novelas García Márquez originales',
   'Colección de 5 novelas de Gabriel García Márquez: Cien Años de Soledad, El Amor en los Tiempos del Cólera, Crónica de una Muerte Anunciada, El Coronel no tiene quien le escriba, La Hojarasca.',
   'books', 'Novelas', 200, 'BOB', 'used_good', 'Oruro', 'Oruro', '{}', 'active', NOW() + INTERVAL '30 days'),

-- ── BABY ─────────────────────────────────────────────────────────────────────

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000001', 'Coche de bebé Chicco Bravo plegable',
   'Coche Chicco Bravo Travel System con silla de auto. Plegado compacto con una mano. Color gris. Excelente estado.',
   'baby', 'Coches', 1200, 'BOB', 'used_good', 'La Paz', 'La Paz', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000003', 'Cuna convertible de madera con colchón',
   'Cuna convertible a cama infantil. Madera de pino macizo. Incluye colchón ortopédico. 3 niveles de altura ajustable.',
   'baby', 'Cunas', 900, 'BOB', 'used_like_new', 'Cochabamba', 'Cochabamba', '{}', 'active', NOW() + INTERVAL '30 days'),

-- ── TOYS ─────────────────────────────────────────────────────────────────────

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000002', 'LEGO Technic Porsche 911 GT3 RS 42056',
   'LEGO Technic Porsche 911 GT3 RS set 42056. 2704 piezas completas. Armado una vez y exhibido. Con caja e instrucciones.',
   'toys', 'LEGO', 1500, 'BOB', 'used_like_new', 'Santa Cruz', 'Santa Cruz de la Sierra', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000005', 'PlayStation 5 Slim con 2 controles',
   'PS5 Slim edición disco con 2 controles DualSense. 1TB. Con juego Spider-Man 2 incluido. Todo original.',
   'toys', 'Consolas', 3800, 'BOB', 'used_like_new', 'Oruro', 'Oruro', '{}', 'active', NOW() + INTERVAL '30 days'),

-- ── More ELECTRONICS (variety) ───────────────────────────────────────────────

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000004', 'Laptop HP Pavilion 15 Ryzen 5 nuevo',
   'HP Pavilion 15 con Ryzen 5 5600H, 16GB RAM, SSD 512GB. Pantalla IPS 15.6". Para trabajo, estudio y gaming ligero. Nueva sellada.',
   'electronics', 'Laptops', 4500, 'BOB', 'new', 'Tarija', 'Tarija', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000005', 'MacBook Air M2 2022 256GB',
   'MacBook Air M2 chip, 256GB SSD, 8GB RAM. Color Midnight. Ciclos de carga: 45. Incluye cargador MagSafe original.',
   'electronics', 'Laptops', 7200, 'BOB', 'used_like_new', 'Oruro', 'Oruro', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000003', 'Impresora Epson L3250 EcoTank WiFi',
   'Impresora Epson EcoTank L3250 multifuncional con WiFi. Sistema de tinta continua original. Imprime, escanea y copia. Seminueva.',
   'electronics', 'Impresoras', 950, 'BOB', 'used_like_new', 'Cochabamba', 'Cochabamba', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), '9f2a22c7-ddfc-4ebd-ad0a-b5cfaeb3ab9e', 'Celular Xiaomi Redmi Note 12 Pro 128GB',
   'Xiaomi Redmi Note 12 Pro, 128GB, 8GB RAM. Cámara 108MP. Pantalla AMOLED 120Hz. Dual SIM. Con protector y funda.',
   'electronics', 'Celulares', 1800, 'BOB', 'used_good', 'La Paz', 'El Alto', '{}', 'active', NOW() + INTERVAL '30 days'),

  (gen_random_uuid(), 'a1000001-0000-0000-0000-000000000001', 'Consola Nintendo Switch OLED blanca',
   'Nintendo Switch OLED modelo blanco. Con 3 juegos: Zelda Tears of the Kingdom, Mario Kart 8, Animal Crossing. 2 controles extra.',
   'electronics', 'Consolas', 2800, 'BOB', 'used_good', 'La Paz', 'La Paz', '{}', 'active', NOW() + INTERVAL '30 days');


-- =============================================================================
-- 3. Demand Offers (sellers offering their products on demand posts)
-- =============================================================================

-- We need to map products to matching demand posts.
-- Strategy: for each demand post, pick 1-3 products from DIFFERENT sellers that match the category.

DO $$
DECLARE
  v_demand RECORD;
  v_product RECORD;
  v_count INT;
BEGIN
  -- iPhone demand -> phone products
  FOR v_product IN
    SELECT id, user_id FROM products
    WHERE category = 'electronics'
      AND subcategory = 'Celulares'
      AND status = 'active'
    LIMIT 3
  LOOP
    FOR v_demand IN
      SELECT id, user_id FROM demand_posts
      WHERE title ILIKE '%iPhone%' OR title ILIKE '%Samsung%' OR title ILIKE '%celular%'
      LIMIT 4
    LOOP
      IF v_product.user_id != v_demand.user_id THEN
        INSERT INTO demand_offers (id, demand_post_id, product_id, seller_id, message, created_at)
        VALUES (
          gen_random_uuid(), v_demand.id, v_product.id, v_product.user_id,
          'Tengo este producto disponible, está en excelente estado. Podemos coordinar la entrega.',
          NOW() - (random() * INTERVAL '12 hours')
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  -- Monitor demand -> monitor products
  FOR v_product IN
    SELECT id, user_id FROM products
    WHERE subcategory = 'Monitores' AND status = 'active'
    LIMIT 2
  LOOP
    FOR v_demand IN
      SELECT id, user_id FROM demand_posts WHERE title ILIKE '%monitor%' LIMIT 2
    LOOP
      IF v_product.user_id != v_demand.user_id THEN
        INSERT INTO demand_offers (id, demand_post_id, product_id, seller_id, message, created_at)
        VALUES (
          gen_random_uuid(), v_demand.id, v_product.id, v_product.user_id,
          'Mi monitor cumple con lo que buscas, tiene entrada HDMI y resolución 4K.',
          NOW() - (random() * INTERVAL '8 hours')
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  -- Laptop demand -> laptop products
  FOR v_product IN
    SELECT id, user_id FROM products
    WHERE (subcategory = 'Laptops' OR title ILIKE '%laptop%') AND status = 'active'
    LIMIT 3
  LOOP
    FOR v_demand IN
      SELECT id, user_id FROM demand_posts WHERE title ILIKE '%laptop%' LIMIT 2
    LOOP
      IF v_product.user_id != v_demand.user_id THEN
        INSERT INTO demand_offers (id, demand_post_id, product_id, seller_id, message, created_at)
        VALUES (
          gen_random_uuid(), v_demand.id, v_product.id, v_product.user_id,
          'Te ofrezco esta laptop, tiene las especificaciones que necesitas para diseño.',
          NOW() - (random() * INTERVAL '6 hours')
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  -- Moto demand -> moto products
  FOR v_product IN
    SELECT id, user_id FROM products
    WHERE subcategory = 'Motos' AND status = 'active'
    LIMIT 2
  LOOP
    FOR v_demand IN
      SELECT id, user_id FROM demand_posts WHERE title ILIKE '%moto%' LIMIT 2
    LOOP
      IF v_product.user_id != v_demand.user_id THEN
        INSERT INTO demand_offers (id, demand_post_id, product_id, seller_id, message, created_at)
        VALUES (
          gen_random_uuid(), v_demand.id, v_product.id, v_product.user_id,
          'Tengo esta moto al día con papeles, lista para delivery. Acepto prueba de manejo.',
          NOW() - (random() * INTERVAL '10 hours')
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  -- Bicicleta demand -> bicicleta products
  FOR v_product IN
    SELECT id, user_id FROM products
    WHERE (subcategory = 'Bicicletas' OR title ILIKE '%biciclet%') AND status = 'active'
    LIMIT 3
  LOOP
    FOR v_demand IN
      SELECT id, user_id FROM demand_posts WHERE title ILIKE '%biciclet%' LIMIT 3
    LOOP
      IF v_product.user_id != v_demand.user_id THEN
        INSERT INTO demand_offers (id, demand_post_id, product_id, seller_id, message, created_at)
        VALUES (
          gen_random_uuid(), v_demand.id, v_product.id, v_product.user_id,
          'Esta bicicleta está en muy buen estado, perfecta para lo que necesitas.',
          NOW() - (random() * INTERVAL '5 hours')
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  -- Chompa/ropa demand -> fashion products
  FOR v_product IN
    SELECT id, user_id FROM products
    WHERE category = 'fashion' AND status = 'active'
    LIMIT 3
  LOOP
    FOR v_demand IN
      SELECT id, user_id FROM demand_posts
      WHERE title ILIKE '%chompa%' OR title ILIKE '%vestido%' OR title ILIKE '%ropa%'
      LIMIT 3
    LOOP
      IF v_product.user_id != v_demand.user_id THEN
        INSERT INTO demand_offers (id, demand_post_id, product_id, seller_id, message, created_at)
        VALUES (
          gen_random_uuid(), v_demand.id, v_product.id, v_product.user_id,
          'Tengo justo lo que buscas, está en perfecto estado. Te puedo enviar más fotos por WhatsApp.',
          NOW() - (random() * INTERVAL '7 hours')
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  -- Taladro/construcción demand -> construction products
  FOR v_product IN
    SELECT id, user_id FROM products
    WHERE category = 'construction' AND status = 'active'
    LIMIT 3
  LOOP
    FOR v_demand IN
      SELECT id, user_id FROM demand_posts
      WHERE title ILIKE '%taladro%' OR title ILIKE '%herramient%'
      LIMIT 2
    LOOP
      IF v_product.user_id != v_demand.user_id THEN
        INSERT INTO demand_offers (id, demand_post_id, product_id, seller_id, message, created_at)
        VALUES (
          gen_random_uuid(), v_demand.id, v_product.id, v_product.user_id,
          'Tengo esta herramienta profesional disponible. Funciona perfectamente, la puedo probar contigo.',
          NOW() - (random() * INTERVAL '9 hours')
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  -- Cochecito/bebé demand -> baby products
  FOR v_product IN
    SELECT id, user_id FROM products
    WHERE category = 'baby' AND status = 'active'
    LIMIT 2
  LOOP
    FOR v_demand IN
      SELECT id, user_id FROM demand_posts
      WHERE title ILIKE '%cochecito%' OR title ILIKE '%bebé%' OR title ILIKE '%cuna%'
      LIMIT 2
    LOOP
      IF v_product.user_id != v_demand.user_id THEN
        INSERT INTO demand_offers (id, demand_post_id, product_id, seller_id, message, created_at)
        VALUES (
          gen_random_uuid(), v_demand.id, v_product.id, v_product.user_id,
          'Este producto está como nuevo, lo usamos muy poco. Te puedo dar buen precio.',
          NOW() - (random() * INTERVAL '4 hours')
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  -- Libro demand -> books products
  FOR v_product IN
    SELECT id, user_id FROM products
    WHERE category = 'books' AND status = 'active'
    LIMIT 2
  LOOP
    FOR v_demand IN
      SELECT id, user_id FROM demand_posts
      WHERE title ILIKE '%libro%' OR title ILIKE '%medicina%'
      LIMIT 2
    LOOP
      IF v_product.user_id != v_demand.user_id THEN
        INSERT INTO demand_offers (id, demand_post_id, product_id, seller_id, message, created_at)
        VALUES (
          gen_random_uuid(), v_demand.id, v_product.id, v_product.user_id,
          'Tengo estos libros en buen estado, puedo hacer envío a tu ciudad.',
          NOW() - (random() * INTERVAL '3 hours')
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  -- Escritorio/hogar demand -> home products
  FOR v_product IN
    SELECT id, user_id FROM products
    WHERE category = 'home' AND status = 'active'
    LIMIT 4
  LOOP
    FOR v_demand IN
      SELECT id, user_id FROM demand_posts
      WHERE title ILIKE '%escritorio%' OR title ILIKE '%sala%' OR title ILIKE '%estufa%' OR title ILIKE '%mueble%'
      LIMIT 3
    LOOP
      IF v_product.user_id != v_demand.user_id THEN
        INSERT INTO demand_offers (id, demand_post_id, product_id, seller_id, message, created_at)
        VALUES (
          gen_random_uuid(), v_demand.id, v_product.id, v_product.user_id,
          'Te puedo ofrecer este producto, está en muy buenas condiciones. Hacemos entrega a domicilio.',
          NOW() - (random() * INTERVAL '11 hours')
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  -- Mancuernas/gym demand -> sports products
  FOR v_product IN
    SELECT id, user_id FROM products
    WHERE category = 'sports' AND status = 'active'
    LIMIT 3
  LOOP
    FOR v_demand IN
      SELECT id, user_id FROM demand_posts
      WHERE title ILIKE '%mancuerna%' OR title ILIKE '%gimnasio%' OR title ILIKE '%deporte%'
      LIMIT 2
    LOOP
      IF v_product.user_id != v_demand.user_id THEN
        INSERT INTO demand_offers (id, demand_post_id, product_id, seller_id, message, created_at)
        VALUES (
          gen_random_uuid(), v_demand.id, v_product.id, v_product.user_id,
          'Equipo deportivo en excelente estado, te hago buen precio si retiras.',
          NOW() - (random() * INTERVAL '6 hours')
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  -- Camera demand -> camera products
  FOR v_product IN
    SELECT id, user_id FROM products
    WHERE subcategory = 'Cámaras' AND status = 'active'
    LIMIT 2
  LOOP
    FOR v_demand IN
      SELECT id, user_id FROM demand_posts WHERE title ILIKE '%cámara%' OR title ILIKE '%fotograf%'
      LIMIT 2
    LOOP
      IF v_product.user_id != v_demand.user_id THEN
        INSERT INTO demand_offers (id, demand_post_id, product_id, seller_id, message, created_at)
        VALUES (
          gen_random_uuid(), v_demand.id, v_product.id, v_product.user_id,
          'Esta cámara es perfecta para empezar en fotografía profesional. Incluye lente y bolso.',
          NOW() - (random() * INTERVAL '8 hours')
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

END $$;

-- =============================================================================
-- 4. Update demand_posts.offers_count to match actual offers
-- =============================================================================

UPDATE demand_posts dp
SET offers_count = (
  SELECT COUNT(*) FROM demand_offers do2 WHERE do2.demand_post_id = dp.id
);

COMMIT;
