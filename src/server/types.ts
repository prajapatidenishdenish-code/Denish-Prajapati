export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  referral_code: string;
  referred_by_id: number | null;
  country: string;
  risk_score: number;
  is_suspended: boolean;
  suspended_reason?: string | null;
  created_at: string;
  last_login_at: string;
}

export interface Admin {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: 'superadmin' | 'admin' | 'moderator';
  created_at: string;
}

export interface Session {
  id: number;
  token: string;
  user_id?: number | null;
  admin_id?: number | null;
  ip_address: string;
  user_agent: string;
  expires_at: string;
  created_at: string;
}

export interface Wallet {
  id: number;
  user_id: number;
  balance_coins: number;
  pending_coins: number;
  lifetime_earnings_coins: number;
  lifetime_withdrawals_coins: number;
  updated_at: string;
}

export type TransactionType =
  | 'OFFER_REWARD'
  | 'BONUS'
  | 'DAILY_BONUS'
  | 'REFERRAL_REWARD'
  | 'WITHDRAWAL'
  | 'WITHDRAWAL_REVERSAL'
  | 'ADMIN_ADJUSTMENT';

export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED';

export interface Transaction {
  id: number;
  wallet_id: number;
  user_id: number;
  type: TransactionType;
  amount_coins: number; // positive for credits, negative for debits
  balance_after_coins: number;
  reference_id: string;
  description: string;
  status: TransactionStatus;
  created_at: string;
}

export type OfferCategory = 'VIDEO_AD' | 'SURVEY' | 'APP_INSTALL' | 'SIGNUP' | 'CPA_OFFER';

export interface Offer {
  id: number;
  title: string;
  description: string;
  category: OfferCategory;
  reward_coins: number;
  estimated_minutes: number;
  requirements: string;
  provider_id: string; // 'cpagrip' | 'adgate' | 'demo'
  external_offer_id: string;
  tracking_url_template: string;
  target_countries: string; // 'ALL' or comma-separated e.g. 'US,IN,GB,CA'
  daily_cap: number; // 0 = unlimited
  active: boolean;
  created_at: string;
  // Demo specific video length / media if applicable
  video_duration_sec?: number;
  video_url?: string;
  sponsor_brand?: string;
  banner_url?: string;
}

export interface OfferSession {
  id: number;
  tracking_token: string;
  user_id: number;
  offer_id: number;
  provider_id: string;
  ip_address: string;
  user_agent: string;
  status: 'STARTED' | 'PENDING_VERIFICATION' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  started_at: string;
  completed_at: string | null;
}

export interface Conversion {
  id: number;
  conversion_id: string;
  tracking_token: string;
  user_id: number;
  offer_id: number;
  provider_id: string;
  payout_usd: number;
  reward_coins: number;
  owner_profit_usd?: number;
  status: 'VERIFIED' | 'REJECTED' | 'DUPLICATE';
  ip_address: string;
  raw_payload: string;
  created_at: string;
}

export type WithdrawalMethod = 'UPI' | 'PAYPAL' | 'BANK_TRANSFER' | 'CRYPTO';
export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED' | 'CANCELLED';

export interface Withdrawal {
  id: number;
  user_id: number;
  amount_coins: number;
  amount_fiat: number;
  currency: string;
  method: WithdrawalMethod;
  payment_details: string; // JSON string or identifier
  status: WithdrawalStatus;
  admin_note?: string | null;
  transaction_ref?: string | null;
  requested_at: string;
  processed_at: string | null;
}

export interface Referral {
  id: number;
  referrer_user_id: number;
  referee_user_id: number;
  bonus_awarded_coins: number;
  status: 'ACTIVE' | 'PENDING' | 'FLAGGED';
  created_at: string;
}

export interface DailyBonus {
  id: number;
  user_id: number;
  amount_coins: number;
  streak_day: number;
  claimed_at: string;
}

export interface FraudFlag {
  id: number;
  user_id: number;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  resolved: boolean;
  created_at: string;
}

export interface AdminNote {
  id: number;
  user_id: number;
  admin_id: number;
  note: string;
  created_at: string;
}

export interface SiteSettings {
  site_name: string;
  currency: string;
  coin_exchange_rate: number; // e.g. 1000 coins = $1.00
  min_withdrawal_coins: number; // e.g. 5000 coins ($5.00)
  referral_signup_bonus: number; // e.g. 100 coins
  referral_commission_percent: number; // e.g. 10%
  daily_bonus_base_coins: number; // e.g. 50 coins
  daily_bonus_streak_increment: number; // e.g. 25 coins
  daily_bonus_max_streak: number; // e.g. 7 days
  maintenance_mode: boolean;
  allowed_countries: string[];
}

export interface ProviderSettings {
  id: number;
  provider_name: string;
  api_key: string;
  publisher_id: string;
  postback_secret: string;
  postback_url: string;
  default_reward_margin_percent: number;
  video_locker_code?: string;
  video_locker_url?: string;
  video_locker_reward_coins?: number;
  video_slot_1_code?: string;
  video_slot_1_url?: string;
  video_slot_2_code?: string;
  video_slot_2_url?: string;
  offer_slot_3_code?: string;
  offer_slot_3_url?: string;
  enabled: boolean;
  updated_at: string;
}

export interface InAppNotification {
  id: string;
  user_id: number;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}
