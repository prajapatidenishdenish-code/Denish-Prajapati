-- =========================================================
-- AdEarn Pro Universal PostgreSQL Production Schema
-- Designed for Neon, Supabase, Cloud SQL, AWS RDS, Render
-- =========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    referred_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    country VARCHAR(10) DEFAULT 'US',
    is_suspended BOOLEAN DEFAULT FALSE,
    suspended_reason TEXT,
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'superadmin',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. WALLETS TABLE
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance_coins INTEGER DEFAULT 0,
    pending_coins INTEGER DEFAULT 0,
    lifetime_earnings_coins INTEGER DEFAULT 0,
    lifetime_withdrawals_coins INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRANSACTIONS LEDGER (Immutable)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    amount_coins INTEGER NOT NULL,
    balance_after_coins INTEGER NOT NULL,
    reference_id VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. OFFERS TABLE (Tasks & Video Ads)
CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- VIDEO_AD, APP_INSTALL, SURVEY, SIGNUP, CPA_OFFER
    reward_coins INTEGER NOT NULL,
    estimated_minutes INTEGER DEFAULT 2,
    requirements TEXT NOT NULL,
    provider_id VARCHAR(50) DEFAULT 'cpagrip',
    external_offer_id VARCHAR(100),
    tracking_url_template TEXT NOT NULL,
    target_countries VARCHAR(100) DEFAULT 'ALL',
    daily_cap INTEGER DEFAULT 5,
    active BOOLEAN DEFAULT TRUE,
    video_duration_sec INTEGER DEFAULT 30,
    sponsor_brand VARCHAR(255),
    banner_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. OFFER TRACKING SESSIONS
CREATE TABLE IF NOT EXISTS offer_sessions (
    id SERIAL PRIMARY KEY,
    tracking_token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    provider_id VARCHAR(50) NOT NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    status VARCHAR(50) DEFAULT 'STARTED', -- STARTED, COMPLETED, EXPIRED, FLAGGED
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- 7. CONVERSIONS (Verified Postbacks)
CREATE TABLE IF NOT EXISTS conversions (
    id SERIAL PRIMARY KEY,
    conversion_id VARCHAR(255) UNIQUE NOT NULL,
    tracking_token VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    provider_id VARCHAR(50) NOT NULL,
    payout_usd NUMERIC(10, 4) NOT NULL,
    reward_coins INTEGER NOT NULL,
    owner_profit_usd NUMERIC(10, 4) NOT NULL,
    status VARCHAR(50) DEFAULT 'VERIFIED',
    ip_address VARCHAR(100),
    raw_payload TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. WITHDRAWALS
CREATE TABLE IF NOT EXISTS withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_coins INTEGER NOT NULL,
    amount_fiat NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    method VARCHAR(50) NOT NULL, -- UPI, PAYPAL, BANK_TRANSFER, CRYPTO
    payment_details TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PROCESSING, PAID, REJECTED
    admin_note TEXT,
    transaction_ref VARCHAR(255),
    requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ
);

-- 9. SESSIONS (Web / Auth)
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
    ip_address VARCHAR(100),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. SITE SETTINGS
CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    site_name VARCHAR(255) DEFAULT 'AdEarn Pro',
    currency VARCHAR(10) DEFAULT 'USD',
    coin_exchange_rate INTEGER DEFAULT 1000,
    min_withdrawal_coins INTEGER DEFAULT 5000,
    referral_signup_bonus INTEGER DEFAULT 100,
    referral_commission_percent INTEGER DEFAULT 10,
    daily_bonus_base_coins INTEGER DEFAULT 50,
    daily_bonus_streak_increment INTEGER DEFAULT 25,
    daily_bonus_max_streak INTEGER DEFAULT 7,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    direct_smartlink_url TEXT,
    banner_ad_code TEXT,
    popunder_code TEXT
);

-- 11. PROVIDER SETTINGS (CPAGrip, etc.)
CREATE TABLE IF NOT EXISTS provider_settings (
    id SERIAL PRIMARY KEY,
    provider_name VARCHAR(50) UNIQUE NOT NULL,
    api_key VARCHAR(255),
    publisher_id VARCHAR(100),
    postback_secret VARCHAR(255),
    postback_url VARCHAR(255),
    default_reward_margin_percent INTEGER DEFAULT 60,
    video_locker_code TEXT,
    video_locker_url TEXT,
    video_locker_reward_coins INTEGER DEFAULT 500,
    enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. IN-APP NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR HIGH-PERFORMANCE POSTBACKS & SESSIONS
CREATE INDEX IF NOT EXISTS idx_offer_sessions_token ON offer_sessions(tracking_token);
CREATE INDEX IF NOT EXISTS idx_conversions_id ON conversions(conversion_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
