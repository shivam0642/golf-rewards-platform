CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'General',
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT 'United Kingdom',
  image TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  upcoming_events TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'SUBSCRIBER' CHECK (role IN ('PUBLIC_VISITOR', 'SUBSCRIBER', 'ADMINISTRATOR')),
  subscription_status TEXT NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'expired', 'incomplete', 'inactive')),
  plan TEXT CHECK (plan IS NULL OR plan IN ('monthly', 'yearly', 'pro')),
  charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
  contribution_percent INTEGER NOT NULL DEFAULT 10 CHECK (contribution_percent >= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'cancelled', 'expired', 'incomplete', 'inactive')),
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly', 'pro')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'GBP',
  renewal_date TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 45),
  score_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, score_date)
);

CREATE TABLE IF NOT EXISTS draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL CHECK (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  mode TEXT NOT NULL CHECK (mode IN ('RANDOM', 'ALGORITHMIC')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'simulated', 'published')),
  winning_numbers INTEGER[] NOT NULL DEFAULT '{}',
  jackpot_rollover NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (jackpot_rollover >= 0),
  simulation JSONB,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  UNIQUE (month)
);

CREATE TABLE IF NOT EXISTS winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_numbers INTEGER NOT NULL CHECK (matched_numbers IN (3, 4, 5)),
  match_type TEXT NOT NULL CHECK (match_type IN ('5', '4', '3')),
  prize_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (prize_amount >= 0),
  proof_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id UUID NOT NULL UNIQUE REFERENCES winners(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'rejected')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE RESTRICT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'GBP',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_date ON scores(user_id, score_date DESC);
CREATE INDEX IF NOT EXISTS idx_draws_status_month ON draws(status, month);
CREATE INDEX IF NOT EXISTS idx_winners_draw_id ON winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_user_id ON winners(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_charity_id ON donations(charity_id);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);

COMMENT ON TABLE users IS 'Application users. Access is exclusively through the trusted Express API.';
COMMENT ON TABLE payouts IS 'Records payout state; no money transfer is performed by this application.';
