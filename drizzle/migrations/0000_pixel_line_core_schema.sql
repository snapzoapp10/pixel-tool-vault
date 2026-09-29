-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'user');
CREATE TYPE public.delivery_mode AS ENUM ('auto', 'manual');
CREATE TYPE public.order_status AS ENUM ('pending', 'verified', 'delivered', 'rejected', 'cancelled');
CREATE TYPE public.payment_kind AS ENUM ('mobile', 'crypto');
CREATE TYPE public.key_status AS ENUM ('available', 'delivered');

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ========== ROLES ==========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== CATALOG ==========
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (is_active);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  brand TEXT,
  short_description TEXT,
  long_description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  delivery_mode public.delivery_mode NOT NULL DEFAULT 'manual',
  delivery_time_text TEXT NOT NULL DEFAULT 'Within 5-30 minutes',
  terms TEXT,
  seo_title TEXT,
  seo_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated USING (is_active);

CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_bdt NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  compare_price_bdt NUMERIC(12,2),
  stock_qty INT NOT NULL DEFAULT 0,
  unlimited_stock BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "variants public read" ON public.product_variants FOR SELECT TO anon, authenticated USING (is_active);

-- ========== PAYMENT METHODS ==========
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  kind public.payment_kind NOT NULL,
  account_value TEXT,
  network TEXT,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.payment_methods TO anon, authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment methods public read" ON public.payment_methods FOR SELECT TO anon, authenticated USING (is_active);

-- ========== COUPONS ==========
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- ========== ORDERS ==========
CREATE SEQUENCE public.order_number_seq START 1001;
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('PL-' || nextval('public.order_number_seq')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_note TEXT,
  currency TEXT NOT NULL DEFAULT 'BDT',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  coupon_code TEXT,
  payment_method_key TEXT,
  payment_method_name TEXT,
  txn_id TEXT,
  sender_account TEXT,
  proof_path TEXT,
  status public.order_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reject_reason TEXT,
  delivered_content TEXT,
  country_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orders read" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity INT NOT NULL DEFAULT 1,
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivered_content TEXT
);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- ========== LICENSE KEY STOCK (service_role only) ==========
CREATE TABLE public.license_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  secret_value TEXT NOT NULL,
  status public.key_status NOT NULL DEFAULT 'available',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.license_keys TO service_role;
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

-- ========== REVIEWS ==========
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  rating INT NOT NULL DEFAULT 5,
  body TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (is_approved);

-- ========== BLOG ==========
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published posts public read" ON public.blog_posts FOR SELECT TO anon, authenticated USING (is_published);

-- ========== SETTINGS ==========
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

-- ========== ACTIVITY LOG ==========
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ========== SEED ==========
INSERT INTO public.site_settings (key, value) VALUES
  ('general', '{"site_name":"Pixel Line","tagline":"Genuine AI subscriptions, credits & tool licenses","support_hours":"10 AM - 2 AM (BD time)","whatsapp":"","messenger":"https://facebook.com/","email":"support@pixelline.shop","usd_to_bdt":122,"announcement":"Instant delivery on most products. Verified payment, real support."}'::jsonb);

INSERT INTO public.categories (slug, name, description, sort_order) VALUES
  ('ai-subscription', 'AI Subscription', 'Premium AI plan subscriptions on your own account or shared access.', 1),
  ('ai-credit', 'AI Credit', 'Top up API credits and usage balance for AI platforms.', 2),
  ('tools-license', 'Tools License', 'Genuine license keys and activations for AI & productivity tools.', 3);

INSERT INTO public.payment_methods (key, name, kind, account_value, network, instructions, sort_order) VALUES
  ('bkash', 'bKash', 'mobile', '01XXXXXXXXX', 'Send Money / Personal', 'Send the exact amount using Send Money, then submit the Transaction ID below.', 1),
  ('nagad', 'Nagad', 'mobile', '01XXXXXXXXX', 'Send Money / Personal', 'Send the exact amount using Send Money, then submit the Transaction ID below.', 2),
  ('rocket', 'Rocket', 'mobile', '01XXXXXXXXX', 'Send Money / Personal', 'Send the exact amount, then submit the Transaction ID below.', 3),
  ('binance', 'Binance Pay', 'crypto', 'Pay ID: 000000000', 'USDT (BEP20/TRC20)', 'Send USDT to the given Pay ID or address, then submit the TxID below.', 4),
  ('bybit', 'Bybit', 'crypto', 'UID: 00000000', 'USDT (TRC20)', 'Send USDT to the given UID/address, then submit the TxID below.', 5);

INSERT INTO public.products (slug, title, brand, short_description, long_description, category_id, delivery_mode, delivery_time_text, terms, is_featured, sort_order)
SELECT 'chatgpt-plus', 'ChatGPT Plus Subscription', 'OpenAI',
 'Official ChatGPT Plus on your own account. Fast activation, full support.',
 'Get ChatGPT Plus activated on your own OpenAI account. You keep full access to GPT-5 class models, advanced data analysis, image generation and faster responses. We activate it on your email — no sharing, no risk.',
 c.id, 'manual', 'Within 10-30 minutes', 'Do not change the account password during the subscription period. Refund only if activation fails.', true, 1
FROM public.categories c WHERE c.slug = 'ai-subscription';

INSERT INTO public.products (slug, title, brand, short_description, long_description, category_id, delivery_mode, delivery_time_text, is_featured, sort_order)
SELECT 'openai-api-credit', 'OpenAI API Credit Top-Up', 'OpenAI',
 'Add API credit balance to your own OpenAI developer account.',
 'We top up your OpenAI API account with the credit amount you choose. Works for GPT and image models. You get a confirmation screenshot with every top-up.',
 c.id, 'manual', 'Within 30-60 minutes', true, 2
FROM public.categories c WHERE c.slug = 'ai-credit';

INSERT INTO public.products (slug, title, brand, short_description, long_description, category_id, delivery_mode, delivery_time_text, is_featured, sort_order)
SELECT 'canva-pro-license', 'Canva Pro License (1 Year)', 'Canva',
 'Genuine Canva Pro invite license for your own email. Instant key delivery.',
 'Receive a Canva Pro activation link/key for your own account. All premium templates, background remover, brand kit and 1TB storage included for a full year.',
 c.id, 'auto', 'Instant after payment approval', true, 3
FROM public.categories c WHERE c.slug = 'tools-license';

INSERT INTO public.product_variants (product_id, name, price_bdt, price_usd, compare_price_bdt, unlimited_stock, sort_order)
SELECT p.id, v.name, v.bdt, v.usd, v.cmp, true, v.ord FROM public.products p
JOIN (VALUES
  ('chatgpt-plus', '1 Month', 1450, 12.00, 2400, 1),
  ('chatgpt-plus', '3 Months', 3990, 33.00, 6500, 2),
  ('chatgpt-plus', '1 Year', 13900, 115.00, 24000, 3),
  ('openai-api-credit', '$5 Credit', 750, 6.50, NULL, 1),
  ('openai-api-credit', '$10 Credit', 1400, 12.00, NULL, 2),
  ('openai-api-credit', '$25 Credit', 3400, 28.00, NULL, 3),
  ('canva-pro-license', '1 Year (own email)', 390, 3.50, 900, 1)
) AS v(slug, name, bdt, usd, cmp, ord) ON v.slug = p.slug;

INSERT INTO public.reviews (product_id, author_name, rating, body, is_approved)
SELECT p.id, r.nm, 5, r.bd, true FROM public.products p
JOIN (VALUES
  ('chatgpt-plus', 'Tanvir Ahmed', 'Payment verified in 5 minutes and Plus was active. Totally trustworthy seller.'),
  ('canva-pro-license', 'Sadia Islam', 'Got the key instantly after bKash payment. Working perfectly.'),
  ('openai-api-credit', 'Rakib Hasan', 'Credit added with proof screenshot. Will buy again.')
) AS r(slug, nm, bd) ON r.slug = p.slug;
