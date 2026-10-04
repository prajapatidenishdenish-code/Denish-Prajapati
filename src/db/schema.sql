-- ====================================================================
-- AdEarn Pro - Production Relational PostgreSQL Database Schema
-- Compatible with PostgreSQL 13+ (Cloud SQL / Supabase / Neon / RDS)
-- ====================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    referral_code VARCHAR(32) NOT NULL UNIQUE,
    referred_by_id INT REFERENCES users(id) ON DELETE SET NULL,
    country VARCHAR(3) DEFAULT 'US',
    risk_score INT DEFAULT 0,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspended_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- 2. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    token VARCHAR(128) NOT NULL UNIQUE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    admin_id INT REFERENCES admins(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- 4. Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance_coins INT DEFAULT 0 CHECK (balance_coins >= 0),
    pending_coins INT DEFAULT 0 CHECK (pending_coins >= 0),
    lifetime_earnings_coins INT DEFAULT 0,
    lifetime_withdrawals_coins INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);

-- 5. Transactions Table (Immutable Ledger)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    wallet_id INT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL, -- 'OFFER_REWARD', 'DAILY_BONUS', 'REFERRAL_REWARD', 'WITHDRAWAL', 'WITHDRAWAL_REVERSAL', 'ADMIN_ADJUSTMENT'
    amount_coins INT NOT NULL,
    balance_after_coins INT NOT NULL,
    reference_id VARCHAR(128),
    description TEXT,
    status VARCHAR(20) DEFAULT 'COMPLETED', -- 'COMPLETED', 'PENDING', 'CANCELLED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- 6. Offers Table
CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'VIDEO_AD', 'SURVEY', 'APP_INSTALL', 'SIGNUP', 'CPA_OFFER'
    reward_coins INT NOT NULL CHECK (reward_coins > 0),
    estimated_minutes INT DEFAULT 2,
    requirements TEXT,
    provider_id VARCHAR(50) DEFAULT 'cpagrip',
    external_offer_id VARCHAR(100),
    tracking_url_template TEXT,
    target_countries TEXT, -- Comma-separated or 'ALL'
    daily_cap INT DEFAULT 0, -- 0 = unlimited
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(active);

-- 7. Offer Sessions Table (Server-side tracking records)
CREATE TABLE IF NOT EXISTS offer_sessions (
    id SERIAL PRIMARY KEY,
    tracking_token VARCHAR(128) NOT NULL UNIQUE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    offer_id INT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    provider_id VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(30) DEFAULT 'STARTED', -- 'STARTED', 'PENDING_VERIFICATION', 'COMPLETED', 'FAILED', 'EXPIRED'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_offer_sessions_token ON offer_sessions(tracking_token);
CREATE INDEX IF NOT EXISTS idx_offer_sessions_user ON offer_sessions(user_id);

-- 8. Conversions Table (Postback Deduplication & Auditing)
CREATE TABLE IF NOT EXISTS conversions (
    id SERIAL PRIMARY KEY,
    conversion_id VARCHAR(128) NOT NULL UNIQUE, -- Crucial for idempotency
    tracking_token VARCHAR(128) NOT NULL,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    offer_id INT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    provider_id VARCHAR(50) NOT NULL,
    payout_usd NUMERIC(10, 4) DEFAULT 0.0000,
    reward_coins INT NOT NULL,
    status VARCHAR(30) DEFAULT 'VERIFIED',
    ip_address VARCHAR(45),
    raw_payload TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversions_unique_id ON conversions(conversion_id);
CREATE INDEX IF NOT EXISTS idx_conversions_user ON conversions(user_id);

-- 9. Withdrawals Table
CREATE TABLE IF NOT EXISTS withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_coins INT NOT NULL CHECK (amount_coins > 0),
    amount_fiat NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    method VARCHAR(30) NOT NULL, -- 'UPI', 'PAYPAL', 'BANK_TRANSFER', 'CRYPTO'
    payment_details TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'PAID', 'REJECTED', 'CANCELLED'
    admin_note TEXT,
    transaction_ref VARCHAR(128),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- 10. Referrals Table
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referee_user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bonus_awarded_coins INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);

-- 11. Daily Bonuses Table
CREATE TABLE IF NOT EXISTS daily_bonuses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_coins INT NOT NULL,
    streak_day INT DEFAULT 1,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_bonuses_user ON daily_bonuses(user_id);

-- 12. Fraud Flags Table
CREATE TABLE IF NOT EXISTS fraud_flags (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(150) NOT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    details TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_user ON fraud_flags(user_id);

-- 13. Admin Notes Table
CREATE TABLE IF NOT EXISTS admin_notes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_id INT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Provider Settings Table
CREATE TABLE IF NOT EXISTS provider_settings (
    id SERIAL PRIMARY KEY,
    provider_name VARCHAR(50) NOT NULL UNIQUE,
    api_key TEXT,
    publisher_id VARCHAR(100),
    postback_secret VARCHAR(128),
    postback_url TEXT,
    default_reward_margin_percent INT DEFAULT 70,
    enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
