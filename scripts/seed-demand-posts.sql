-- Seed 5 sample demand posts for dev@telopillo.test
-- Run: npx supabase db execute -f scripts/seed-demand-posts.sql
-- Or: psql $DATABASE_URL -f scripts/seed-demand-posts.sql

-- Delete existing demand posts from dev user (to allow re-seeding)
DELETE FROM public.demand_posts
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dev@telopillo.test');

-- Insert 5 distinct sample demand posts
INSERT INTO public.demand_posts (
  user_id, title, description, category, location_department, location_city, price_min, price_max
)
SELECT
  (SELECT id FROM auth.users WHERE email = 'dev@telopillo.test'),
  v.title,
  v.description,
  v.category,
  v.location_department,
  v.location_city,
  v.price_min,
  v.price_max
FROM (VALUES
  (
    'Busco iPhone 14 o 15 en buen estado',
    'Estoy buscando un iPhone 14 o 15 en buen estado, preferiblemente con caja y accesorios originales. Color negro o blanco. Que tenga batería en buenas condiciones.',
    'electronics',
    'La Paz',
    'La Paz',
    1500,
    4000
  ),
  (
    'Necesito muebles de oficina usados',
    'Busco escritorio, silla ergonómica y estante para armar mi oficina en casa. Pueden ser usados pero en buen estado. Tengo pickup para recoger en Cochabamba.',
    'home',
    'Cochabamba',
    'Cochabamba',
    200,
    1500
  ),
  (
    'Busco bicicleta mountain bike aro 29',
    'Necesito una bicicleta mountain bike aro 29 para uso recreativo en senderos. Preferiblemente con frenos de disco hidráulicos y suspensión delantera. Marcas como Trek, Giant o Specialized.',
    'sports',
    'Santa Cruz',
    'Santa Cruz de la Sierra',
    800,
    3000
  ),
  (
    'Busco juegos de mesa para familia',
    'Estoy buscando juegos de mesa para noches familiares. Monopoly, Catán, Uno, Jenga o similares. Pueden ser nuevos o usados en buen estado. También me interesan puzzles de 1000 piezas.',
    'toys',
    'La Paz',
    'El Alto',
    50,
    300
  ),
  (
    'Necesito ropa de bebé talla 0-6 meses',
    'Mi bebé va a nacer pronto y necesito ropa de recién nacido talla 0 a 6 meses. Bodies, pijamas, gorros, medias. Prefiero algodón. Puede ser usado en buen estado o nuevo.',
    'baby',
    'Oruro',
    'Oruro',
    30,
    200
  )
) AS v(title, description, category, location_department, location_city, price_min, price_max);
