-- PXG Golf Iceland — Migration v2
-- Líma þetta inn í Supabase Dashboard → SQL Editor
-- Þetta bætir við nýjum dálkum, töflum og PXG vörugögnum.

-- =====================================================
-- 1. UPPFÆRA CLUBS TÖFLUNA
-- =====================================================
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'equipment',
  ADD COLUMN IF NOT EXISTS gender text DEFAULT 'unisex',
  ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '{"options": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS extra_images jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS specs jsonb DEFAULT '{}'::jsonb;

-- =====================================================
-- 2. UPPFÆRA FLOKKA (eyða gömlu, setja inn ný)
-- =====================================================
-- Eyða clubs fyrst (FK constraint) — þær verða settar inn aftur neðar
DELETE FROM public.clubs;
DELETE FROM public.categories;

INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('Drivers',         'driver',           'Lengd og nákvæmni frá teðinu',          1),
  ('Fairway Woods',   'fairway',          'Fjarlægð og nákvæmni af fairway',        2),
  ('Hybrids',         'hybrid',           'Besta af báðum heimum',                  3),
  ('Járn',            'iron',             'Nákvæmni í hverri högg',                 4),
  ('Wedges',          'wedge',            'Meistaraleikur í stuttu leiknum',        5),
  ('Putters',         'putter',           'Sigurinn á putting green',               6),
  ('Herraleikföt',    'mens-apparel',     'Klæðnaður fyrir karla',                  7),
  ('Damaleikföt',     'womens-apparel',   'Klæðnaður fyrir konur',                  8),
  ('Golf Töskur',     'bags',             'Premium PXG golf töskur',                9),
  ('Aukahlutir',      'accessories',      'Boltar, hanskar og meira',               10);

-- =====================================================
-- 3. AFSLÁTTAR KÓÐAR TAFLA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code        text NOT NULL UNIQUE,
  type        text NOT NULL DEFAULT 'percentage', -- 'percentage' | 'fixed'
  value       numeric NOT NULL,
  min_order_isk integer DEFAULT 0,
  max_uses    integer,
  uses_count  integer DEFAULT 0,
  active      boolean DEFAULT true,
  expires_at  timestamptz,
  description text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allir geta skoðað kóða" ON public.discount_codes;
DROP POLICY IF EXISTS "Admin getur stjórnað kóðum" ON public.discount_codes;
CREATE POLICY "Allir geta skoðað kóða"        ON public.discount_codes FOR SELECT USING (active = true);
CREATE POLICY "Admin getur stjórnað kóðum"    ON public.discount_codes FOR ALL    USING (auth.role() = 'authenticated');

-- Sýnidæmi kóðar
INSERT INTO public.discount_codes (code, type, value, description) VALUES
  ('PXGISLAND10', 'percentage', 10, '10% afsláttur á allar vörur'),
  ('VELKOMINN',   'percentage', 15, '15% velkomin afsláttur'),
  ('GOLF5000',    'fixed',      5000, '5.000 kr. afsláttur');

-- =====================================================
-- 4. PANTANIR TAFLA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number    text NOT NULL,
  status          text DEFAULT 'pending',  -- pending | confirmed | shipped | completed | cancelled
  customer_name   text NOT NULL,
  customer_email  text NOT NULL,
  customer_phone  text,
  shipping_address text,
  items           jsonb NOT NULL DEFAULT '[]',
  subtotal_isk    integer NOT NULL DEFAULT 0,
  discount_isk    integer DEFAULT 0,
  discount_code   text,
  total_isk       integer NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allir geta sent pöntun" ON public.orders;
DROP POLICY IF EXISTS "Admin getur séð pantanir" ON public.orders;
DROP POLICY IF EXISTS "Admin getur uppfært pantanir" ON public.orders;
CREATE POLICY "Allir geta sent pöntun"        ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin getur séð pantanir"      ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin getur uppfært pantanir"  ON public.orders FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================================================
-- 5. VÖRUGÖGN — PXG KYLFUR OG VÖRUR
-- ISK = USD * 138 * 1.24 ≈ 171
-- =====================================================

-- Hreinsa gömul gögn (optional - kommenta þetta út ef þú vilt halda gömlu vörunum)
-- DELETE FROM public.clubs;

-- DRIVERS
INSERT INTO public.clubs (name, slug, category_id, category, product_type, price_usd, price_isk,
  short_description, description, is_featured, in_stock, pxg_url, sort_order, is_new, player_type,
  specs, variants)
SELECT
  '0311 Gen8 Driver', '0311-gen8-driver',
  c.id, 'Drivers', 'equipment', 475, 82900,
  'Lengd og stillanlegt loft með nýjustu tækni',
  'The 0311 Gen8 Driver redefines distance and forgiveness. With PXG''s patented weighting system and a new ultra-thin face, this driver delivers explosive distance across the entire face.',
  true, true, 'https://www.pxg.com/products/gen8-drivers', 1, true, 'All Players',
  '{"loft": "9° / 10.5°", "shaft": "Mitsubishi Diamana PD", "flex": "Regular, Stiff, X-Stiff", "adjustable": true}'::jsonb,
  '{"options": ["9°", "10.5°"]}'::jsonb
FROM public.categories c WHERE c.slug = 'driver'

UNION ALL SELECT
  '0311 XF Gen8 Driver', '0311-xf-gen8-driver',
  c.id, 'Drivers', 'equipment', 475, 82900,
  'Stærsti Sweet Spot í sögu PXG — fyrirgefinn og kraftmikill',
  'Designed for maximum forgiveness, the 0311 XF Gen8 Driver features an oversized head and PXG''s advanced MOI weighting system. Perfect for players seeking more consistency off the tee.',
  false, true, 'https://www.pxg.com/products/gen8-drivers', 2, true, 'Beginners',
  '{"loft": "10.5°", "shaft": "Aldila Synergy", "flex": "Regular, Stiff", "adjustable": true}'::jsonb,
  '{"options": ["10.5°"]}'::jsonb
FROM public.categories c WHERE c.slug = 'driver'

UNION ALL SELECT
  '0311 ST Gen8 Driver', '0311-st-gen8-driver',
  c.id, 'Drivers', 'equipment', 575, 99900,
  'Tour-level driver — fyrir kröfuhörðustu leikmennina',
  'The 0311 ST Gen8 Driver is built for the serious golfer who demands tour-level performance. Low spin, penetrating ball flight, and maximum workability.',
  false, true, 'https://www.pxg.com/products/gen8-drivers', 3, false, 'Advanced',
  '{"loft": "8° / 9° / 10.5°", "shaft": "Mitsubishi Diamana PD Tour", "flex": "Stiff, X-Stiff", "adjustable": true}'::jsonb,
  '{"options": ["8°", "9°", "10.5°"]}'::jsonb
FROM public.categories c WHERE c.slug = 'driver';

-- FAIRWAY WOODS
INSERT INTO public.clubs (name, slug, category_id, category, product_type, price_usd, price_isk,
  short_description, description, is_featured, in_stock, pxg_url, sort_order, is_new, player_type,
  specs, variants)
SELECT
  '0341 XF Gen8 Fairway Wood', '0341-xf-gen8-fairway',
  c.id, 'Fairway Woods', 'equipment', 375, 64900,
  'Auðveldur að slá — mikil fjarlægð af fairway og rough',
  'The 0341 XF Gen8 Fairway Wood combines extreme forgiveness with PXG distance technology. The low CG and wide sole make this the easiest fairway wood to launch high and far.',
  true, true, 'https://www.pxg.com/products/gen8-fairway-woods', 1, true, 'All Players',
  '{"loft": "15° / 18° / 21°", "shaft": "Mitsubishi Diamana PD", "adjustable": true}'::jsonb,
  '{"options": ["3W (15°)", "5W (18°)", "7W (21°)"]}'::jsonb
FROM public.categories c WHERE c.slug = 'fairway'

UNION ALL SELECT
  '0341 Gen8 Fairway Wood', '0341-gen8-fairway',
  c.id, 'Fairway Woods', 'equipment', 375, 64900,
  'Classic fairway wood með PXG nákvæmni',
  'Built for players who demand precision and distance from the fairway. Features PXG''s progressive shaping and weighting for a controlled, penetrating ball flight.',
  false, true, 'https://www.pxg.com/products/gen8-fairway-woods', 2, false, 'Advanced',
  '{"loft": "15° / 18°", "shaft": "Mitsubishi Diamana PD", "adjustable": true}'::jsonb,
  '{"options": ["3W (15°)", "5W (18°)"]}'::jsonb
FROM public.categories c WHERE c.slug = 'fairway';

-- HYBRIDS
INSERT INTO public.clubs (name, slug, category_id, category, product_type, price_usd, price_isk,
  short_description, description, is_featured, in_stock, pxg_url, sort_order, is_new, player_type,
  specs, variants)
SELECT
  '0311 Gen8 Hybrid', '0311-gen8-hybrid',
  c.id, 'Hybrids', 'equipment', 275, 47900,
  'Besta af báðum heimum — auðveldur uppgangur og full fjarlægð',
  'The 0311 Gen8 Hybrid gives you the best of both worlds — the distance of a fairway wood with the playability of a long iron. PXG''s hollow body construction delivers explosive distance from any lie.',
  false, true, 'https://www.pxg.com/products/gen8-hybrids', 1, true, 'All Players',
  '{"loft": "17° / 20° / 23°", "shaft": "Mitsubishi Diamana PD Hybrid", "adjustable": false}'::jsonb,
  '{"options": ["2H (17°)", "3H (20°)", "4H (23°)"]}'::jsonb
FROM public.categories c WHERE c.slug = 'hybrid';

-- IRONS
INSERT INTO public.clubs (name, slug, category_id, category, product_type, price_usd, price_isk,
  short_description, description, is_featured, in_stock, pxg_url, sort_order, is_new, player_type,
  specs, variants)
SELECT
  '0311 Gen8 Irons', '0311-gen8-irons',
  c.id, 'Járn', 'equipment', 250, 42900,
  'Per club — nákvæmni og snúningur í toppklassa',
  'The 0311 Gen8 Irons deliver unmatched feel, distance, and precision. PXG''s hollow body with polymer core absorbs unwanted vibration while the forged face delivers explosive distance. Available individually or as a set.',
  true, true, 'https://www.pxg.com/products/gen8-irons', 1, true, 'Advanced',
  '{"material": "Forged 8620 carbon steel", "face": "17-4 stainless steel", "set": "Per club price — 4-PW available"}'::jsonb,
  '{"options": ["4", "5", "6", "7", "8", "9", "PW", "GW"]}'::jsonb
FROM public.categories c WHERE c.slug = 'iron'

UNION ALL SELECT
  '0311 XF Gen8 Irons', '0311-xf-gen8-irons',
  c.id, 'Járn', 'equipment', 250, 42900,
  'Per club — Maximum forgiveness með PXG tækni',
  'Built for maximum forgiveness without sacrificing distance. The oversized head and ultra-low CG make the 0311 XF Gen8 the most forgiving iron PXG has ever made.',
  true, true, 'https://www.pxg.com/products/gen8-irons', 2, true, 'Beginners',
  '{"material": "Cast stainless steel", "face": "Forged 455 stainless", "set": "Per club price — 5-GW available"}'::jsonb,
  '{"options": ["5", "6", "7", "8", "9", "PW", "GW"]}'::jsonb
FROM public.categories c WHERE c.slug = 'iron'

UNION ALL SELECT
  '0317 Gen8 Irons', '0317-gen8-irons',
  c.id, 'Járn', 'equipment', 200, 34900,
  'Per club — Cavity back með premium PXG finish',
  'A versatile cavity back iron combining distance, forgiveness, and workability. The 0317 Gen8 is perfect for mid-handicap players looking to improve consistency.',
  false, true, 'https://www.pxg.com/products/gen8-irons', 3, false, 'All Players',
  '{"material": "Cast 431 stainless steel", "set": "Per club price — 5-GW available"}'::jsonb,
  '{"options": ["5", "6", "7", "8", "9", "PW", "GW"]}'::jsonb
FROM public.categories c WHERE c.slug = 'iron';

-- WEDGES
INSERT INTO public.clubs (name, slug, category_id, category, product_type, price_usd, price_isk,
  short_description, description, is_featured, in_stock, pxg_url, sort_order, is_new, player_type,
  specs, variants)
SELECT
  '0311 Forged Wedge', '0311-forged-wedge',
  c.id, 'Wedges', 'equipment', 195, 33900,
  'Handsmíðaður wedge — nákvæmni og tilfinningu í toppi',
  'The 0311 Forged Wedge delivers tour-level spin, feel, and versatility. Forged from soft 8620 carbon steel with a hand-finished chrome plating.',
  true, true, 'https://www.pxg.com/products/0311-forged-wedge', 1, false, 'All Players',
  '{"material": "Forged 8620 carbon steel", "finish": "Chrome plated", "grind": "S / W / F grind options"}'::jsonb,
  '{"options": ["50°", "52°", "54°", "56°", "58°", "60°"]}'::jsonb
FROM public.categories c WHERE c.slug = 'wedge'

UNION ALL SELECT
  'Sugar Daddy III Wedge', 'sugar-daddy-iii-wedge',
  c.id, 'Wedges', 'equipment', 200, 34900,
  'Maximum snúningur — ótrúlegt grip á ball',
  'The Sugar Daddy III Wedge features PXG''s most aggressive groove design for maximum spin in all conditions. A favorite on the PGA Tour.',
  false, true, 'https://www.pxg.com/products/sugar-daddy-iii-wedge', 2, true, 'Advanced',
  '{"material": "Forged 8620 carbon steel", "finish": "Raw / Chrome", "spin": "Tour-level grooves"}'::jsonb,
  '{"options": ["54°", "56°", "58°", "60°"]}'::jsonb
FROM public.categories c WHERE c.slug = 'wedge';

-- PUTTERS
INSERT INTO public.clubs (name, slug, category_id, category, product_type, price_usd, price_isk,
  short_description, description, is_featured, in_stock, pxg_url, sort_order, is_new, player_type,
  specs, variants)
SELECT
  '0211 Putter', '0211-putter',
  c.id, 'Putters', 'equipment', 225, 38900,
  'Classic og versatile — fallegt lag og nákvæmni',
  'The 0211 Putter combines classic aesthetics with PXG technology. Available in multiple head shapes to suit any putting style.',
  false, true, 'https://www.pxg.com/products/0211-putter', 1, false, 'All Players',
  '{"material": "Machined aluminum / Steel", "length": "33\", 34\", 35\""}'::jsonb,
  '{"options": ["Blade", "Mid-Mallet", "Mallet"]}'::jsonb
FROM public.categories c WHERE c.slug = 'putter'

UNION ALL SELECT
  'Blackjack Plus Putter', 'blackjack-plus-putter',
  c.id, 'Putters', 'equipment', 600, 102900,
  'Premium luxury putter — úrvalsleikmaðurinn krefst þessa',
  'The Blackjack Plus is the pinnacle of PXG putter engineering. Hand-machined from aircraft-grade aluminum with a PVD coating, this putter delivers unmatched feel and alignment.',
  true, true, 'https://www.pxg.com/products/blackjack-plus-putter', 2, false, 'Advanced',
  '{"material": "Machined 6061 aircraft aluminum", "finish": "PVD black coating", "insert": "Polymer face insert"}'::jsonb,
  '{"options": ["34\"", "35\""]}'::jsonb
FROM public.categories c WHERE c.slug = 'putter'

UNION ALL SELECT
  'Battle Ready II Putter', 'battle-ready-ii-putter',
  c.id, 'Putters', 'equipment', 400, 68900,
  'High MOI og super-forgiving — landað í þínum höndum',
  'The Battle Ready II Putter features extreme MOI and a face-balanced design for the ultimate in forgiveness and consistency on the greens.',
  false, true, 'https://www.pxg.com/products/battle-ready-ii-putters', 3, true, 'All Players',
  '{"material": "Machined 303 stainless steel", "moi": "Extreme high MOI", "balance": "Face balanced / Toe hang"}'::jsonb,
  '{"options": ["Bird Dog", "Mustang", "Operator", "Skeleton"]}'::jsonb
FROM public.categories c WHERE c.slug = 'putter';

-- MEN'S APPAREL
INSERT INTO public.clubs (name, slug, category_id, category, product_type, price_usd, price_isk,
  short_description, description, is_featured, in_stock, pxg_url, sort_order, is_new, player_type,
  gender, variants)
SELECT
  'Men''s Performance Polo', 'mens-performance-polo',
  c.id, 'Herraleikföt', 'apparel', 95, 16900,
  '4-way stretch — kæling og þægindi á brautinni',
  'Stay cool and comfortable on the course with PXG''s Men''s Performance Polo. Features 4-way stretch fabric, moisture-wicking technology, and UPF 50+ sun protection.',
  false, true, 'https://www.pxg.com/products/mens-performance-polo', 1, true, 'All Players',
  'men', '{"sizes": ["XS", "S", "M", "L", "XL", "XXL"], "colors": ["Hvítur", "Svartur", "Grátt", "Blátt"]}'::jsonb
FROM public.categories c WHERE c.slug = 'mens-apparel'

UNION ALL SELECT
  'Men''s 1/4 Zip Pullover', 'mens-quarter-zip-pullover',
  c.id, 'Herraleikföt', 'apparel', 150, 25900,
  'Hlýtt og létt — fullkomið í vetur-kring leikim',
  'The Men''s 1/4 Zip Pullover combines style and performance. Warm, lightweight, and designed for the golf course with a PXG embroidered logo.',
  false, true, 'https://www.pxg.com/products/mens-quarter-zip-pullover', 2, false, 'All Players',
  'men', '{"sizes": ["XS", "S", "M", "L", "XL", "XXL"], "colors": ["Svartur", "Grátt", "Hvítur"]}'::jsonb
FROM public.categories c WHERE c.slug = 'mens-apparel'

UNION ALL SELECT
  'Men''s Golf Pants', 'mens-golf-pants',
  c.id, 'Herraleikföt', 'apparel', 125, 21900,
  'Stretch-buxur — þæginlegar í hverri högg',
  'Engineered for the golf course, these performance pants feature 4-way stretch and a modern straight-leg fit. Moisture-wicking and wrinkle-resistant.',
  false, true, 'https://www.pxg.com/products/mens-golf-pants', 3, false, 'All Players',
  'men', '{"sizes": ["30x32", "32x32", "34x32", "36x32", "38x32", "32x34", "34x34", "36x34"], "colors": ["Svartur", "Grátt", "Kaki", "Hvítur"]}'::jsonb
FROM public.categories c WHERE c.slug = 'mens-apparel'

UNION ALL SELECT
  'Men''s Golf Shorts', 'mens-golf-shorts',
  c.id, 'Herraleikföt', 'apparel', 95, 16900,
  'Ultra-léttar golfskyr — fullkomnar í sumarleik',
  'Stay cool in the heat with PXG''s Men''s Golf Shorts. Lightweight, stretchy fabric with a 9" inseam and hidden zip pockets.',
  false, true, 'https://www.pxg.com/products/mens-golf-shorts', 4, true, 'All Players',
  'men', '{"sizes": ["30", "32", "34", "36", "38", "40"], "colors": ["Svartur", "Hvítur", "Kaki", "Blátt"]}'::jsonb
FROM public.categories c WHERE c.slug = 'mens-apparel'

UNION ALL SELECT
  'Men''s Snapback Hat', 'mens-snapback-hat',
  c.id, 'Herraleikföt', 'apparel', 45, 7900,
  'PXG embroidered logo — stíll og vernd',
  'The PXG Men''s Snapback Hat features a premium embroidered PXG logo and an adjustable snapback closure. One size fits most.',
  false, true, 'https://www.pxg.com/products/mens-hats', 5, false, 'All Players',
  'men', '{"sizes": ["One Size"], "colors": ["Svartur", "Hvítur", "Grátt", "Navy"]}'::jsonb
FROM public.categories c WHERE c.slug = 'mens-apparel';

-- WOMEN'S APPAREL
INSERT INTO public.clubs (name, slug, category_id, category, product_type, price_usd, price_isk,
  short_description, description, is_featured, in_stock, pxg_url, sort_order, is_new, player_type,
  gender, variants)
SELECT
  'Women''s Performance Polo', 'womens-performance-polo',
  c.id, 'Damaleikföt', 'apparel', 95, 16900,
  'Falleg og þægileg — PXG stíll á brautinni',
  'The Women''s Performance Polo combines style and performance. Features 4-way stretch, moisture-wicking technology, and a feminine cut. UPF 50+ sun protection.',
  false, true, 'https://www.pxg.com/products/womens-performance-polo', 1, true, 'All Players',
  'women', '{"sizes": ["XS", "S", "M", "L", "XL"], "colors": ["Hvítur", "Svartur", "Bleikt", "Blátt"]}'::jsonb
FROM public.categories c WHERE c.slug = 'womens-apparel'

UNION ALL SELECT
  'Women''s Golf Skort', 'womens-golf-skort',
  c.id, 'Damaleikföt', 'apparel', 95, 16900,
  'Klassísk PXG stíll — þægileg og falleg',
  'The Women''s Golf Skort features an inner short lining for comfort and freedom of movement. Lightweight stretch fabric with PXG branding.',
  false, true, 'https://www.pxg.com/products/womens-golf-skort', 2, false, 'All Players',
  'women', '{"sizes": ["XS", "S", "M", "L", "XL"], "colors": ["Hvítur", "Svartur", "Bleikt"]}'::jsonb
FROM public.categories c WHERE c.slug = 'womens-apparel'

UNION ALL SELECT
  'Women''s 1/4 Zip Pullover', 'womens-quarter-zip-pullover',
  c.id, 'Damaleikföt', 'apparel', 150, 25900,
  'Hlýtt og lightweight — fullkomið í kalt veður',
  'Stay warm and stylish on cold mornings with PXG''s Women''s 1/4 Zip Pullover. Soft, lightweight fabric with a feminine fit and embroidered PXG logo.',
  false, true, 'https://www.pxg.com/products/womens-quarter-zip-pullover', 3, false, 'All Players',
  'women', '{"sizes": ["XS", "S", "M", "L", "XL"], "colors": ["Svartur", "Hvítur", "Bleikt", "Grátt"]}'::jsonb
FROM public.categories c WHERE c.slug = 'womens-apparel';

-- GOLF BAGS
INSERT INTO public.clubs (name, slug, category_id, category, product_type, price_usd, price_isk,
  short_description, description, is_featured, in_stock, pxg_url, sort_order, is_new, player_type,
  variants)
SELECT
  'PXG Lightweight Stand Bag', 'pxg-stand-bag',
  c.id, 'Golf Töskur', 'accessory', 500, 85900,
  '14-way divider — létt og stöðug í öllum veðrum',
  'The PXG Lightweight Stand Bag features a 14-way top divider, multiple pockets with magnetic closures, and a comfortable dual-strap system. Built for the serious golfer.',
  false, true, 'https://www.pxg.com/products/stand-bag', 1, true, 'All Players',
  '{"options": ["Svartur", "Hvítur", "Svartur/Gullinn"]}'::jsonb
FROM public.categories c WHERE c.slug = 'bags'

UNION ALL SELECT
  'PXG Cart Bag', 'pxg-cart-bag',
  c.id, 'Golf Töskur', 'accessory', 600, 102900,
  'Premium cart bag — 15-way divider og mikið pláss',
  'The PXG Cart Bag offers maximum organization with a 15-way top divider and 10 pockets including a cooler pocket and waterproof valuables pocket.',
  false, true, 'https://www.pxg.com/products/cart-bag', 2, false, 'All Players',
  '{"options": ["Svartur", "Hvítur"]}'::jsonb
FROM public.categories c WHERE c.slug = 'bags';

-- ACCESSORIES
INSERT INTO public.clubs (name, slug, category_id, category, product_type, price_usd, price_isk,
  short_description, description, is_featured, in_stock, pxg_url, sort_order, is_new, player_type,
  variants)
SELECT
  'PXG Golf Balls (12 pcs)', 'pxg-golf-balls',
  c.id, 'Aukahlutir', 'accessory', 50, 8900,
  'PXG Xtreme Distance — lengd og snúningur',
  'PXG golf balls are engineered for maximum distance and optimal spin separation. Available in 2-piece Xtreme Distance and 3-piece performance models.',
  false, true, 'https://www.pxg.com/products/golf-balls', 1, false, 'All Players',
  '{"options": ["Xtreme Distance (2-piece)", "Soft (3-piece)"], "qty": "12 stykki í pakka"}'::jsonb
FROM public.categories c WHERE c.slug = 'accessories'

UNION ALL SELECT
  'PXG Driver Headcover', 'pxg-driver-headcover',
  c.id, 'Aukahlutir', 'accessory', 75, 12900,
  'Verndar dýrmætan driver þinn í stíl',
  'Protect your investment with a premium PXG headcover. Made from soft synthetic leather with a magnetic closure and embroidered PXG logo.',
  false, true, 'https://www.pxg.com/products/headcovers', 2, true, 'All Players',
  '{"options": ["Svartur/Gullinn", "Hvítur/Gullinn", "Svartur/Hvítur"]}'::jsonb
FROM public.categories c WHERE c.slug = 'accessories'

UNION ALL SELECT
  'PXG Golf Glove', 'pxg-golf-glove',
  c.id, 'Aukahlutir', 'accessory', 30, 5900,
  'Cabretta leather — nákvæmt grip í hverri högg',
  'The PXG Golf Glove is made from premium Cabretta leather for superior feel and durability. Features a secure velcro closure and PXG branding.',
  false, true, 'https://www.pxg.com/products/gloves', 3, false, 'All Players',
  '{"options": ["S", "M", "ML", "L", "XL"], "hand": "Vinstri hönd (fyrir hægri leikmenn)"}'::jsonb
FROM public.categories c WHERE c.slug = 'accessories'

UNION ALL SELECT
  'PXG Fairway Wood Headcover', 'pxg-fairway-headcover',
  c.id, 'Aukahlutir', 'accessory', 50, 8900,
  'Verndar fairway wood með stíl',
  'Premium synthetic leather fairway wood headcover with magnetic closure. Fits 3W, 5W, and 7W.',
  false, true, 'https://www.pxg.com/products/headcovers', 4, false, 'All Players',
  '{"options": ["3W", "5W", "7W"]}'::jsonb
FROM public.categories c WHERE c.slug = 'accessories';

-- =====================================================
-- 6. STORAGE BUCKET (keyrðu þetta separat ef þarf)
-- =====================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);
-- CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'images');
-- CREATE POLICY "Auth upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
