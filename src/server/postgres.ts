import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export interface PostgresStatus {
  connected: boolean;
  databaseUrlConfigured: boolean;
  ssl: boolean;
  host?: string;
  database?: string;
  error?: string;
  tablesCount?: number;
}

let pool: pg.Pool | null = null;
let isConnected = false;
let lastError: string | null = null;

export function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function initPostgresPool(): pg.Pool | null {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    return null;
  }

  if (pool) return pool;

  try {
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    pool = new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL Pool Unexpected Error]:', err);
      isConnected = false;
      lastError = err.message;
    });

    return pool;
  } catch (err: any) {
    console.error('[PostgreSQL Initialization Error]:', err.message);
    lastError = err.message;
    return null;
  }
}

export async function testPostgresConnection(): Promise<PostgresStatus> {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    return {
      connected: false,
      databaseUrlConfigured: false,
      ssl: false,
      error: 'DATABASE_URL is not set in environment. Running in local JSON storage mode.',
    };
  }

  const p = initPostgresPool();
  if (!p) {
    return {
      connected: false,
      databaseUrlConfigured: true,
      ssl: false,
      error: lastError || 'Failed to initialize PostgreSQL pool',
    };
  }

  let client: pg.PoolClient | null = null;
  try {
    client = await p.connect();
    const res = await client.query('SELECT current_database(), inet_server_addr()');
    const tableRes = await client.query(`
      SELECT count(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    isConnected = true;
    lastError = null;

    return {
      connected: true,
      databaseUrlConfigured: true,
      ssl: !connectionString.includes('localhost'),
      database: res.rows[0]?.current_database || 'postgres',
      host: res.rows[0]?.inet_server_addr || 'cloud-postgres',
      tablesCount: parseInt(tableRes.rows[0]?.count || '0', 10),
    };
  } catch (err: any) {
    isConnected = false;
    lastError = err.message;
    return {
      connected: false,
      databaseUrlConfigured: true,
      ssl: false,
      error: err.message,
    };
  } finally {
    if (client) client.release();
  }
}

export async function runPostgresMigrations(): Promise<{ success: boolean; message: string }> {
  const p = initPostgresPool();
  if (!p) {
    return { success: false, message: 'DATABASE_URL not configured.' };
  }

  let client: pg.PoolClient | null = null;
  try {
    client = await p.connect();

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        referral_code VARCHAR(50) UNIQUE NOT NULL,
        referred_by_id INTEGER,
        country VARCHAR(10) DEFAULT 'US',
        is_suspended BOOLEAN DEFAULT FALSE,
        suspended_reason TEXT,
        risk_score INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'superadmin',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL,
        balance_coins INTEGER DEFAULT 0,
        pending_coins INTEGER DEFAULT 0,
        lifetime_earnings_coins INTEGER DEFAULT 0,
        lifetime_withdrawals_coins INTEGER DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        wallet_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount_coins INTEGER NOT NULL,
        balance_after_coins INTEGER NOT NULL,
        reference_id VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'COMPLETED',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS offers (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
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

      CREATE TABLE IF NOT EXISTS offer_sessions (
        id SERIAL PRIMARY KEY,
        tracking_token VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        offer_id INTEGER NOT NULL,
        provider_id VARCHAR(50) NOT NULL,
        ip_address VARCHAR(100),
        user_agent TEXT,
        status VARCHAR(50) DEFAULT 'STARTED',
        started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS conversions (
        id SERIAL PRIMARY KEY,
        conversion_id VARCHAR(255) UNIQUE NOT NULL,
        tracking_token VARCHAR(255) NOT NULL,
        user_id INTEGER NOT NULL,
        offer_id INTEGER NOT NULL,
        provider_id VARCHAR(50) NOT NULL,
        payout_usd NUMERIC(10, 4) NOT NULL,
        reward_coins INTEGER NOT NULL,
        owner_profit_usd NUMERIC(10, 4) NOT NULL,
        status VARCHAR(50) DEFAULT 'VERIFIED',
        ip_address VARCHAR(100),
        raw_payload TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS withdrawals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount_coins INTEGER NOT NULL,
        amount_fiat NUMERIC(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        method VARCHAR(50) NOT NULL,
        payment_details TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        admin_note TEXT,
        transaction_ref VARCHAR(255),
        requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER,
        admin_id INTEGER,
        ip_address VARCHAR(100),
        user_agent TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

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
    `);

    return { success: true, message: 'PostgreSQL tables verified and migrated successfully!' };
  } catch (err: any) {
    return { success: false, message: `Migration failed: ${err.message}` };
  } finally {
    if (client) client.release();
  }
}
