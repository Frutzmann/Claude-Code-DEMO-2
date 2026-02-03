-- Migration: 006_billing.sql
-- Billing tables for Stripe integration
-- Tables: customers, products, prices, subscriptions

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Pricing type for Stripe prices
CREATE TYPE pricing_type AS ENUM ('one_time', 'recurring');

-- Pricing plan interval for recurring prices
CREATE TYPE pricing_plan_interval AS ENUM ('day', 'week', 'month', 'year');

-- Subscription status from Stripe
CREATE TYPE subscription_status AS ENUM (
  'trialing',
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
  'paused'
);

-- ============================================================================
-- CUSTOMERS TABLE
-- Links Supabase users to Stripe customer IDs
-- ============================================================================

CREATE TABLE customers (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS but no user policies (service role only)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Updated at trigger
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- PRODUCTS TABLE
-- Synced from Stripe products
-- ============================================================================

CREATE TABLE products (
  id TEXT PRIMARY KEY, -- Stripe product ID (prod_xxx)
  active BOOLEAN DEFAULT true,
  name TEXT,
  description TEXT,
  image TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS with public read
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Updated at trigger
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- PRICES TABLE
-- Synced from Stripe prices
-- ============================================================================

CREATE TABLE prices (
  id TEXT PRIMARY KEY, -- Stripe price ID (price_xxx)
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  description TEXT,
  unit_amount BIGINT, -- Price in cents
  currency TEXT DEFAULT 'usd',
  type pricing_type DEFAULT 'recurring',
  interval pricing_plan_interval DEFAULT 'month',
  interval_count INTEGER DEFAULT 1,
  trial_period_days INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS with public read
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prices are publicly readable"
  ON prices FOR SELECT
  TO authenticated
  USING (true);

-- Updated at trigger
CREATE TRIGGER prices_updated_at
  BEFORE UPDATE ON prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- User subscription records synced from Stripe
-- ============================================================================

CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY, -- Stripe subscription ID (sub_xxx)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status subscription_status NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  price_id TEXT REFERENCES prices(id),
  quantity INTEGER DEFAULT 1,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created TIMESTAMPTZ DEFAULT now(),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ
);

-- Enable RLS - users can view own subscription
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX subscriptions_user_status_idx ON subscriptions(user_id, status);
CREATE INDEX subscriptions_price_idx ON subscriptions(price_id);

-- ============================================================================
-- GRANT SERVICE ROLE ACCESS
-- Webhooks need to modify billing tables
-- ============================================================================

-- Service role policies for customers table
CREATE POLICY "Service role can manage customers"
  ON customers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role policies for products table
CREATE POLICY "Service role can manage products"
  ON products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role policies for prices table
CREATE POLICY "Service role can manage prices"
  ON prices FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role policies for subscriptions table
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
