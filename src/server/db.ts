import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  User,
  Admin,
  Session,
  Wallet,
  Transaction,
  Offer,
  OfferSession,
  Conversion,
  Withdrawal,
  Referral,
  DailyBonus,
  FraudFlag,
  AdminNote,
  SiteSettings,
  ProviderSettings,
  InAppNotification,
  TransactionType,
} from './types.ts';

interface DatabaseSchema {
  users: User[];
  admins: Admin[];
  sessions: Session[];
  wallets: Wallet[];
  transactions: Transaction[];
  offers: Offer[];
  offer_sessions: OfferSession[];
  conversions: Conversion[];
  withdrawals: Withdrawal[];
  referrals: Referral[];
  daily_bonuses: DailyBonus[];
  fraud_flags: FraudFlag[];
  admin_notes: AdminNote[];
  site_settings: SiteSettings;
  provider_settings: ProviderSettings[];
  notifications: InAppNotification[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'app_database.json');

// Ensure data folder exists (safe for serverless/read-only environments like Vercel)
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {
  // Read-only filesystem on Vercel lambda - in-memory fallback will activate
}

function hashPassword(password: string): string {
  const salt = 'adearn_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'AdEarn Pro',
  currency: 'USD',
  coin_exchange_rate: 1000, // 1000 coins = $1.00 USD
  min_withdrawal_coins: 5000, // 5000 coins = $5.00 USD minimum
  referral_signup_bonus: 100, // 100 coins to new user
  referral_commission_percent: 10, // 10% commission on offer completions
  daily_bonus_base_coins: 50,
  daily_bonus_streak_increment: 25,
  daily_bonus_max_streak: 7,
  maintenance_mode: false,
  allowed_countries: ['ALL', 'US', 'IN', 'GB', 'CA', 'AU', 'DE', 'FR'],
};

const DEFAULT_PROVIDER_SETTINGS: ProviderSettings[] = [
  {
    id: 1,
    provider_name: 'adsterra',
    api_key: 'adsterra_smartlink_key',
    publisher_id: 'adsterra_publisher',
    postback_secret: 'adsterra_secret',
    postback_url: '/api/postback/adsterra',
    default_reward_margin_percent: 30, // 30% to user in coins, 70% GUARANTEED pure cash owner profit to Denish
    video_locker_code: '',
    video_locker_url: 'https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed',
    video_locker_reward_coins: 500,
    video_slot_1_url: 'https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed',
    video_slot_2_url: 'https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed',
    offer_slot_3_url: 'https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed',
    enabled: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    provider_name: 'cpagrip',
    api_key: '',
    publisher_id: '',
    postback_secret: '',
    postback_url: '/api/postback/cpagrip',
    default_reward_margin_percent: 65,
    enabled: false,
    updated_at: new Date().toISOString(),
  },
];

const CPAGRIP_OFFER_URL = 'https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed';

const INITIAL_OFFERS: Offer[] = [
  {
    id: 1,
    title: 'Watch Sponsor Spotlight: FinTech Revolution',
    description: 'Watch a verified 30-second high-definition sponsor video from NexaPay to learn about borderless money transfers.',
    category: 'VIDEO_AD',
    reward_coins: 120,
    estimated_minutes: 1,
    requirements: 'Watch full 30 seconds without closing or muting.',
    provider_id: 'adsterra',
    external_offer_id: 'vid_101',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 5,
    active: true,
    created_at: new Date().toISOString(),
    video_duration_sec: 30,
    sponsor_brand: 'NexaPay Global',
    banner_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    title: 'Stream Ad: EcoEnergy Solar Future',
    description: 'Watch the official green energy showcase presentation and answer a quick 1-question brand recall.',
    category: 'VIDEO_AD',
    reward_coins: 150,
    estimated_minutes: 1,
    requirements: 'Watch complete 25-second video spotlight.',
    provider_id: 'adsterra',
    external_offer_id: 'vid_102',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 5,
    active: true,
    created_at: new Date().toISOString(),
    video_duration_sec: 25,
    sponsor_brand: 'EcoEnergy Systems',
    banner_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    title: 'Mobile Game: Clash of Kingdoms Trial',
    description: 'Install the award-winning strategy game, complete the introductory tutorial, and reach castle level 3.',
    category: 'APP_INSTALL',
    reward_coins: 850,
    estimated_minutes: 5,
    requirements: 'New users only. Open app and complete tutorial.',
    provider_id: 'adsterra',
    external_offer_id: 'app_201',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 1,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'Kingdom Interactive',
    banner_url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 4,
    title: 'Consumer Pulse: Digital Shopping Survey 2026',
    description: 'Share your shopping preferences on eCommerce delivery speeds and sustainable packaging.',
    category: 'SURVEY',
    reward_coins: 600,
    estimated_minutes: 4,
    requirements: 'Answer all 6 questions honestly with no random answers.',
    provider_id: 'adsterra',
    external_offer_id: 'surv_301',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 3,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'MarketPulse Analytics',
    banner_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 5,
    title: 'Watch Ad: CloudVault AI Backup',
    description: 'Quick 15-second sponsor spotlight on encrypted cloud storage for creators and students.',
    category: 'VIDEO_AD',
    reward_coins: 90,
    estimated_minutes: 1,
    requirements: 'Watch 15 seconds verified playback.',
    provider_id: 'adsterra',
    external_offer_id: 'vid_103',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 10,
    active: true,
    created_at: new Date().toISOString(),
    video_duration_sec: 15,
    sponsor_brand: 'CloudVault AI',
    banner_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 6,
    title: 'Free Signup: CryptoTracker Daily Newsletter',
    description: 'Subscribe with your genuine email to receive daily morning market digests (free forever).',
    category: 'SIGNUP',
    reward_coins: 450,
    estimated_minutes: 2,
    requirements: 'Confirm email subscription via confirmation link.',
    provider_id: 'adsterra',
    external_offer_id: 'sgn_401',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 2,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'CryptoTracker Media',
    banner_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 7,
    title: 'Watch Ad: Lumina Smart Fitness Band',
    description: 'Discover the latest biometric sleep and heart rate tracker in this 20-second high energy video.',
    category: 'VIDEO_AD',
    reward_coins: 110,
    estimated_minutes: 1,
    requirements: 'Watch 20 seconds verified playback.',
    provider_id: 'adsterra',
    external_offer_id: 'vid_104',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 8,
    active: true,
    created_at: new Date().toISOString(),
    video_duration_sec: 20,
    sponsor_brand: 'Lumina Wearables',
    banner_url: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 8,
    title: 'CPA Quiz: General Tech & AI Knowledge 2026',
    description: 'Test your knowledge on latest AI tools, processors, and tech history. 100% score unlocks full reward.',
    category: 'CPA_OFFER',
    reward_coins: 750,
    estimated_minutes: 3,
    requirements: 'Pass quiz with 4 out of 4 correct answers.',
    provider_id: 'adsterra',
    external_offer_id: 'cpa_501',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 2,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'TechQuiz Global',
    banner_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 9,
    title: 'HD Stream: CyberShield VPN Ultimate',
    description: 'Watch a 30-second security briefing on military-grade encryption for public WiFi safety.',
    category: 'VIDEO_AD',
    reward_coins: 180,
    estimated_minutes: 1,
    requirements: 'Watch full 30 seconds without skipping.',
    provider_id: 'adsterra',
    external_offer_id: 'vid_105',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 8,
    active: true,
    created_at: new Date().toISOString(),
    video_duration_sec: 30,
    sponsor_brand: 'CyberShield Security',
    banner_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 10,
    title: 'Quick Video: TurboGamer Wireless Headset',
    description: 'Experience ultra-low latency spatial gaming audio in this dynamic 15-second sponsor spotlight.',
    category: 'VIDEO_AD',
    reward_coins: 100,
    estimated_minutes: 1,
    requirements: 'Watch 15 seconds verified playback.',
    provider_id: 'adsterra',
    external_offer_id: 'vid_106',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 10,
    active: true,
    created_at: new Date().toISOString(),
    video_duration_sec: 15,
    sponsor_brand: 'TurboGamer Gear',
    banner_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 11,
    title: 'Sponsor Showcase: NeoBank Zero Fee International Card',
    description: 'Discover borderless multi-currency debit accounts with zero foreign transaction fees.',
    category: 'VIDEO_AD',
    reward_coins: 160,
    estimated_minutes: 1,
    requirements: 'Watch 30 seconds verified playback.',
    provider_id: 'adsterra',
    external_offer_id: 'vid_107',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 6,
    active: true,
    created_at: new Date().toISOString(),
    video_duration_sec: 30,
    sponsor_brand: 'NeoBank Global',
    banner_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 12,
    title: 'Video Reel: PixelStudio AI Photo Editor',
    description: 'See 1-click background removal and generative image expansion in action.',
    category: 'VIDEO_AD',
    reward_coins: 140,
    estimated_minutes: 1,
    requirements: 'Watch 20 seconds verified playback.',
    provider_id: 'adsterra',
    external_offer_id: 'vid_108',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 8,
    active: true,
    created_at: new Date().toISOString(),
    video_duration_sec: 20,
    sponsor_brand: 'PixelStudio Pro',
    banner_url: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 13,
    title: 'Fast App Install: TradePro Stock & Crypto Trading',
    description: 'Download TradePro, register free account and check live market prices to unlock reward.',
    category: 'APP_INSTALL',
    reward_coins: 950,
    estimated_minutes: 3,
    requirements: 'Install app, open and complete free registration.',
    provider_id: 'adsterra',
    external_offer_id: 'app_202',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 2,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'TradePro Markets',
    banner_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 14,
    title: 'Casual Game: Bubble Shooter Legend Adventure',
    description: 'Install and reach stage 5 in this relaxing puzzle game.',
    category: 'APP_INSTALL',
    reward_coins: 500,
    estimated_minutes: 3,
    requirements: 'Install and complete stage 5.',
    provider_id: 'adsterra',
    external_offer_id: 'app_203',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 3,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'JoyPlay Games',
    banner_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 15,
    title: 'Utility App: BatterySaver Pro & Memory Cleaner',
    description: 'Install utility app and run 1-click device optimization scan.',
    category: 'APP_INSTALL',
    reward_coins: 420,
    estimated_minutes: 2,
    requirements: 'Install and open app once.',
    provider_id: 'adsterra',
    external_offer_id: 'app_204',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 4,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'UtilitySoft',
    banner_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 16,
    title: 'Fast App: FitLife Daily Workout & Calorie Tracker',
    description: 'Install FitLife fitness coach app and set your weekly fitness goal.',
    category: 'APP_INSTALL',
    reward_coins: 680,
    estimated_minutes: 4,
    requirements: 'Install and create your personalized workout profile.',
    provider_id: 'adsterra',
    external_offer_id: 'app_205',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 3,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'FitLife Studio',
    banner_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 17,
    title: 'Quick Poll: Daily Tech & Smartphone Habits',
    description: 'Answer 4 quick multiple-choice questions on 5G network speeds and daily screen time.',
    category: 'SURVEY',
    reward_coins: 350,
    estimated_minutes: 2,
    requirements: 'Answer all 4 questions attentively.',
    provider_id: 'adsterra',
    external_offer_id: 'surv_302',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 5,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'TechInsight Labs',
    banner_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 18,
    title: 'Entertainment Survey: OTT Streaming & Cinema Preferences',
    description: 'Vote on your favorite genres, movie release platforms, and subscription services.',
    category: 'SURVEY',
    reward_coins: 480,
    estimated_minutes: 3,
    requirements: 'Complete all 5 questions.',
    provider_id: 'adsterra',
    external_offer_id: 'surv_303',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 4,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'MediaMetrics Global',
    banner_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 19,
    title: 'Finance Opinion: Digital Payments & UPI 2026',
    description: 'Share your feedback on contactless tap-to-pay, QR payments and cashback offers.',
    category: 'SURVEY',
    reward_coins: 550,
    estimated_minutes: 3,
    requirements: 'Complete the short 6-question questionnaire.',
    provider_id: 'adsterra',
    external_offer_id: 'surv_304',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 3,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'FinPoll Analytics',
    banner_url: 'https://images.unsplash.com/photo-1556742049-0a67e557224d?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 20,
    title: 'Free Registration: PrimeRewards Club VIP Trial',
    description: 'Create a free membership account to browse discount vouchers and cashback deals.',
    category: 'SIGNUP',
    reward_coins: 500,
    estimated_minutes: 2,
    requirements: 'Register free account with valid email.',
    provider_id: 'adsterra',
    external_offer_id: 'sgn_402',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 3,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'PrimeRewards Network',
    banner_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 21,
    title: 'Email Signup: TechTrends Weekly AI Brief',
    description: 'Subscribe to the premier AI newsletter to receive curated Monday morning summaries.',
    category: 'SIGNUP',
    reward_coins: 380,
    estimated_minutes: 1,
    requirements: 'Submit your email and confirm subscription.',
    provider_id: 'adsterra',
    external_offer_id: 'sgn_403',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 5,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'TechTrends Media',
    banner_url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 22,
    title: 'Student Free Account: LearnCode Python Academy',
    description: 'Sign up for free beginner Python interactive tutorial track.',
    category: 'SIGNUP',
    reward_coins: 620,
    estimated_minutes: 3,
    requirements: 'Complete free learner account signup.',
    provider_id: 'adsterra',
    external_offer_id: 'sgn_404',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 2,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'LearnCode Online',
    banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 23,
    title: 'Cricket Trivia: World Cup Champions Challenge',
    description: 'Answer 5 quick cricket trivia questions to demonstrate your sports knowledge.',
    category: 'CPA_OFFER',
    reward_coins: 600,
    estimated_minutes: 2,
    requirements: 'Pass trivia with at least 4 out of 5 correct.',
    provider_id: 'adsterra',
    external_offer_id: 'cpa_502',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 3,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'SportTrek Media',
    banner_url: 'https://images.unsplash.com/photo-1531415074868-036b1c57e329?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 24,
    title: 'Scratch & Win: Lucky Gold Ticket Giveaway',
    description: 'Scratch digital golden ticket to reveal instant sponsor coupon code and bonus coins.',
    category: 'CPA_OFFER',
    reward_coins: 800,
    estimated_minutes: 2,
    requirements: 'Complete scratch card verification step.',
    provider_id: 'adsterra',
    external_offer_id: 'cpa_503',
    tracking_url_template: CPAGRIP_OFFER_URL,
    target_countries: 'ALL',
    daily_cap: 2,
    active: true,
    created_at: new Date().toISOString(),
    sponsor_brand: 'LuckySpin Global',
    banner_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
  },
];

class Database {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.loadDatabase();
    this.seedDefaultData();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading database file, initializing defaults:', e);
    }

    return {
      users: [],
      admins: [],
      sessions: [],
      wallets: [],
      transactions: [],
      offers: INITIAL_OFFERS,
      offer_sessions: [],
      conversions: [],
      withdrawals: [],
      referrals: [],
      daily_bonuses: [],
      fraud_flags: [],
      admin_notes: [],
      site_settings: DEFAULT_SETTINGS,
      provider_settings: DEFAULT_PROVIDER_SETTINGS,
      notifications: [],
    };
  }

  private persist() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to persist database:', err);
      }
    }, 100);
  }

  private seedDefaultData() {
    // Seed default admin if missing
    if (this.data.admins.length === 0) {
      const admin: Admin = {
        id: 1,
        email: 'admin@adearn.com',
        name: 'Master Admin',
        password_hash: hashPassword('Admin123!'),
        role: 'superadmin',
        created_at: new Date().toISOString(),
      };
      this.data.admins.push(admin);
    }

    // Ensure site_settings is seeded
    if (!this.data.site_settings) {
      this.data.site_settings = DEFAULT_SETTINGS;
    }
    // Ensure provider_settings is seeded
    if (!this.data.provider_settings || this.data.provider_settings.length === 0) {
      this.data.provider_settings = DEFAULT_PROVIDER_SETTINGS;
    }

    this.persist();
  }

  // --- User Operations ---
  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: number): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByReferralCode(code: string): User | undefined {
    return this.data.users.find((u) => u.referral_code.toUpperCase() === code.toUpperCase());
  }

  public getAllUsers(): User[] {
    return [...this.data.users];
  }

  public createUser(name: string, email: string, passwordPlain: string, referralCodeUsed?: string): { user: User; wallet: Wallet } {
    const existing = this.getUserByEmail(email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    let referredById: number | null = null;
    if (referralCodeUsed) {
      const referrer = this.getUserByReferralCode(referralCodeUsed.trim());
      if (referrer) {
        referredById = referrer.id;
      }
    }

    const nextId = this.data.users.length > 0 ? Math.max(...this.data.users.map((u) => u.id)) + 1 : 1;
    const userRefCode = `EARN${nextId}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const user: User = {
      id: nextId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash: hashPassword(passwordPlain),
      referral_code: userRefCode,
      referred_by_id: referredById,
      country: 'US',
      risk_score: 0,
      is_suspended: false,
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    };
    this.data.users.push(user);

    // Create Wallet
    const walletId = this.data.wallets.length > 0 ? Math.max(...this.data.wallets.map((w) => w.id)) + 1 : 1;
    const signupBonus = this.data.site_settings.referral_signup_bonus || 100;
    const initialCoins = signupBonus;

    const wallet: Wallet = {
      id: walletId,
      user_id: user.id,
      balance_coins: initialCoins,
      pending_coins: 0,
      lifetime_earnings_coins: initialCoins,
      lifetime_withdrawals_coins: 0,
      updated_at: new Date().toISOString(),
    };
    this.data.wallets.push(wallet);

    // Record signup bonus transaction
    this.createTransaction({
      wallet_id: wallet.id,
      user_id: user.id,
      type: 'BONUS',
      amount_coins: initialCoins,
      balance_after_coins: initialCoins,
      reference_id: `signup_bonus_${user.id}`,
      description: 'Welcome Sign-up Bonus',
      status: 'COMPLETED',
    });

    // If referred, create referral record
    if (referredById) {
      const refId = this.data.referrals.length > 0 ? Math.max(...this.data.referrals.map((r) => r.id)) + 1 : 1;
      this.data.referrals.push({
        id: refId,
        referrer_user_id: referredById,
        referee_user_id: user.id,
        bonus_awarded_coins: 0,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      });

      this.addNotification(
        referredById,
        'New Referral Joined!',
        `${user.name} registered using your referral invite. You will earn commissions on their completed offers!`,
        'success'
      );
    }

    this.addNotification(
      user.id,
      'Welcome to AdEarn Pro!',
      `You received ${initialCoins} coins welcome bonus. Start watching ads or completing tasks now!`,
      'success'
    );

    this.persist();
    return { user, wallet };
  }

  public verifyUserCredentials(email: string, passwordPlain: string): User | null {
    const user = this.getUserByEmail(email);
    if (!user) return null;
    const hash = hashPassword(passwordPlain);
    if (user.password_hash === hash) {
      user.last_login_at = new Date().toISOString();
      this.persist();
      return user;
    }
    return null;
  }

  public updateUser(id: number, updates: Partial<User>): User {
    const user = this.getUserById(id);
    if (!user) throw new Error('User not found');
    Object.assign(user, updates);
    this.persist();
    return user;
  }

  // --- Admin Operations ---
  public getAdminByEmail(email: string): Admin | undefined {
    return this.data.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
  }

  public getAdminById(id: number): Admin | undefined {
    return this.data.admins.find((a) => a.id === id);
  }

  public verifyAdminCredentials(email: string, passwordPlain: string): Admin | null {
    const admin = this.getAdminByEmail(email);
    if (!admin) return null;
    const hash = hashPassword(passwordPlain);
    if (admin.password_hash === hash) {
      return admin;
    }
    return null;
  }

  // --- Session Management ---
  public createSession(params: { userId?: number; adminId?: number; ipAddress: string; userAgent: string }): Session {
    const token = crypto.randomBytes(32).toString('hex');
    const nextId = this.data.sessions.length > 0 ? Math.max(...this.data.sessions.map((s) => s.id)) + 1 : 1;
    const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(); // 365 days permanent session

    const session: Session = {
      id: nextId,
      token,
      user_id: params.userId || null,
      admin_id: params.adminId || null,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      expires_at: expires,
      created_at: new Date().toISOString(),
    };

    this.data.sessions.push(session);
    this.persist();
    return session;
  }

  public getSession(token: string): Session | undefined {
    const s = this.data.sessions.find((sess) => sess.token === token);
    if (!s) return undefined;
    if (new Date(s.expires_at) < new Date()) {
      // Expired
      this.deleteSession(token);
      return undefined;
    }
    return s;
  }

  public deleteSession(token: string): boolean {
    const idx = this.data.sessions.findIndex((s) => s.token === token);
    if (idx !== -1) {
      this.data.sessions.splice(idx, 1);
      this.persist();
      return true;
    }
    return false;
  }

  // --- Wallet & Ledger ---
  public getWalletByUserId(userId: number): Wallet {
    let wallet = this.data.wallets.find((w) => w.user_id === userId);
    if (!wallet) {
      const nextId = this.data.wallets.length > 0 ? Math.max(...this.data.wallets.map((w) => w.id)) + 1 : 1;
      wallet = {
        id: nextId,
        user_id: userId,
        balance_coins: 0,
        pending_coins: 0,
        lifetime_earnings_coins: 0,
        lifetime_withdrawals_coins: 0,
        updated_at: new Date().toISOString(),
      };
      this.data.wallets.push(wallet);
      this.persist();
    }
    return wallet;
  }

  public createTransaction(params: {
    wallet_id: number;
    user_id: number;
    type: TransactionType;
    amount_coins: number;
    balance_after_coins: number;
    reference_id: string;
    description: string;
    status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  }): Transaction {
    const nextId = this.data.transactions.length > 0 ? Math.max(...this.data.transactions.map((t) => t.id)) + 1 : 1;
    const tx: Transaction = {
      id: nextId,
      ...params,
      created_at: new Date().toISOString(),
    };
    this.data.transactions.unshift(tx);
    this.persist();
    return tx;
  }

  public getTransactions(userId?: number, limit = 50): Transaction[] {
    let list = this.data.transactions;
    if (userId) {
      list = list.filter((t) => t.user_id === userId);
    }
    return list.slice(0, limit);
  }

  // Atomic credit with ledger entry
  public creditUserWallet(
    userId: number,
    coins: number,
    type: TransactionType,
    referenceId: string,
    description: string
  ): { wallet: Wallet; transaction: Transaction } {
    if (coins <= 0) throw new Error('Credit amount must be positive');
    const wallet = this.getWalletByUserId(userId);
    wallet.balance_coins += coins;
    wallet.lifetime_earnings_coins += coins;
    wallet.updated_at = new Date().toISOString();

    const tx = this.createTransaction({
      wallet_id: wallet.id,
      user_id: userId,
      type,
      amount_coins: coins,
      balance_after_coins: wallet.balance_coins,
      reference_id: referenceId,
      description,
      status: 'COMPLETED',
    });

    this.persist();
    return { wallet, transaction: tx };
  }

  // Atomic debit with ledger entry
  public debitUserWallet(
    userId: number,
    coins: number,
    type: TransactionType,
    referenceId: string,
    description: string
  ): { wallet: Wallet; transaction: Transaction } {
    if (coins <= 0) throw new Error('Debit amount must be positive');
    const wallet = this.getWalletByUserId(userId);
    if (wallet.balance_coins < coins) {
      throw new Error(`Insufficient coin balance. You have ${wallet.balance_coins} coins, requested ${coins}.`);
    }

    wallet.balance_coins -= coins;
    wallet.updated_at = new Date().toISOString();

    const tx = this.createTransaction({
      wallet_id: wallet.id,
      user_id: userId,
      type,
      amount_coins: -coins,
      balance_after_coins: wallet.balance_coins,
      reference_id: referenceId,
      description,
      status: 'COMPLETED',
    });

    this.persist();
    return { wallet, transaction: tx };
  }

  // --- Offers & Sessions ---
  public getOffers(activeOnly = true): Offer[] {
    if (activeOnly) {
      return this.data.offers.filter((o) => o.active);
    }
    return [...this.data.offers];
  }

  public getOfferById(id: number): Offer | undefined {
    return this.data.offers.find((o) => o.id === id);
  }

  public createOffer(offerData: Omit<Offer, 'id' | 'created_at'>): Offer {
    const nextId = this.data.offers.length > 0 ? Math.max(...this.data.offers.map((o) => o.id)) + 1 : 1;
    const offer: Offer = {
      ...offerData,
      id: nextId,
      created_at: new Date().toISOString(),
    };
    this.data.offers.push(offer);
    this.persist();
    return offer;
  }

  public updateOffer(id: number, updates: Partial<Offer>): Offer {
    const offer = this.getOfferById(id);
    if (!offer) throw new Error('Offer not found');
    Object.assign(offer, updates);
    this.persist();
    return offer;
  }

  public deleteOffer(id: number): boolean {
    const index = this.data.offers.findIndex((o) => o.id === id);
    if (index === -1) return false;
    this.data.offers.splice(index, 1);
    this.persist();
    return true;
  }

  public toggleOfferStatus(id: number): Offer {
    const offer = this.getOfferById(id);
    if (!offer) throw new Error('Offer not found');
    offer.active = !offer.active;
    this.persist();
    return offer;
  }

  public changeAdminPassword(adminId: number, newPassword: string): boolean {
    const admin = this.data.admins.find((a) => a.id === adminId);
    if (!admin) return false;
    admin.password_hash = hashPassword(newPassword);
    this.persist();
    return true;
  }

  // Starts a tracking session on server
  public createOfferSession(params: {
    userId: number;
    offerId: number;
    providerId: string;
    ipAddress: string;
    userAgent: string;
  }): OfferSession {
    const trackingToken = `trk_${crypto.randomBytes(20).toString('hex')}`;
    const nextId = this.data.offer_sessions.length > 0 ? Math.max(...this.data.offer_sessions.map((s) => s.id)) + 1 : 1;

    const session: OfferSession = {
      id: nextId,
      tracking_token: trackingToken,
      user_id: params.userId,
      offer_id: params.offerId,
      provider_id: params.providerId,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      status: 'STARTED',
      started_at: new Date().toISOString(),
      completed_at: null,
    };

    this.data.offer_sessions.push(session);
    this.persist();
    return session;
  }

  public getOfferSessionByToken(token: string): OfferSession | undefined {
    return this.data.offer_sessions.find((s) => s.tracking_token === token);
  }

  public getOfferSessionsByUser(userId: number): OfferSession[] {
    return this.data.offer_sessions.filter((s) => s.user_id === userId);
  }

  // --- Postback / Conversion Verification (Idempotent) ---
  public processConversionPostback(params: {
    conversionId: string;
    trackingToken: string;
    payoutUsd: number;
    providerId: string;
    ipAddress: string;
    rawPayload: string;
  }): { success: boolean; duplicate?: boolean; error?: string; rewardCoins?: number } {
    // 1. Check idempotency: Have we already processed this conversion_id?
    const existing = this.data.conversions.find((c) => c.conversion_id === params.conversionId);
    if (existing) {
      return { success: true, duplicate: true, rewardCoins: existing.reward_coins };
    }

    // 2. Validate tracking session
    const session = this.getOfferSessionByToken(params.trackingToken);
    if (!session) {
      return { success: false, error: 'Invalid or missing tracking token' };
    }

    if (session.status === 'COMPLETED') {
      return { success: true, duplicate: true };
    }

    // 3. Find offer
    const offer = this.getOfferById(session.offer_id);
    if (!offer) {
      return { success: false, error: 'Target offer does not exist' };
    }

    // Server-enforced reward and owner profit margin calculation:
    const exchangeRate = this.data.site_settings.coin_exchange_rate || 1000;
    const provSettings = this.data.provider_settings.find((p) => p.provider_name === params.providerId);
    
    // User share % (e.g. 60% user reward share, 40% owner profit)
    const userSharePercent = provSettings?.default_reward_margin_percent ?? 60;
    
    // Effective advertiser payout from CPAGrip in USD
    const payoutUsd = params.payoutUsd > 0
      ? params.payoutUsd
      : Number((offer.reward_coins / exchangeRate).toFixed(2));

    // Dynamic coin reward calculation protecting owner profit:
    // User gets their proportional share of coins, owner keeps (100 - userSharePercent)% in pure dollars!
    const calculatedCoins = Math.floor(payoutUsd * exchangeRate * (userSharePercent / 100));
    const rewardCoins = Math.max(10, calculatedCoins);

    // Calculate owner profit in USD from this conversion
    const userCostUsd = rewardCoins / exchangeRate;
    const ownerProfitUsd = Number(Math.max(0, payoutUsd - userCostUsd).toFixed(3));

    // 4. Record conversion
    const nextConvId = this.data.conversions.length > 0 ? Math.max(...this.data.conversions.map((c) => c.id)) + 1 : 1;
    const conversion: Conversion = {
      id: nextConvId,
      conversion_id: params.conversionId,
      tracking_token: params.trackingToken,
      user_id: session.user_id,
      offer_id: session.offer_id,
      provider_id: params.providerId,
      payout_usd: payoutUsd,
      reward_coins: rewardCoins,
      owner_profit_usd: ownerProfitUsd,
      status: 'VERIFIED',
      ip_address: params.ipAddress,
      raw_payload: params.rawPayload,
      created_at: new Date().toISOString(),
    };
    this.data.conversions.push(conversion);

    // 5. Update session status
    session.status = 'COMPLETED';
    session.completed_at = new Date().toISOString();

    // 6. Credit User Wallet
    this.creditUserWallet(
      session.user_id,
      rewardCoins,
      'OFFER_REWARD',
      params.conversionId,
      `Completed Task: ${offer.title}`
    );

    // 7. Check if user was referred by someone and reward referrer commission
    const user = this.getUserById(session.user_id);
    if (user && user.referred_by_id) {
      const commRate = this.data.site_settings.referral_commission_percent || 10;
      const commissionCoins = Math.floor((rewardCoins * commRate) / 100);
      if (commissionCoins > 0) {
        this.creditUserWallet(
          user.referred_by_id,
          commissionCoins,
          'REFERRAL_REWARD',
          `ref_comm_${params.conversionId}`,
          `Referral Commission (${commRate}%) from ${user.name}`
        );

        // Update referral record
        const refRecord = this.data.referrals.find(
          (r) => r.referrer_user_id === user.referred_by_id && r.referee_user_id === user.id
        );
        if (refRecord) {
          refRecord.bonus_awarded_coins += commissionCoins;
        }

        this.addNotification(
          user.referred_by_id,
          'Referral Commission Earned!',
          `You earned +${commissionCoins} coins from ${user.name}'s completed offer.`,
          'success'
        );
      }
    }

    // 8. Add notification to user
    this.addNotification(
      session.user_id,
      'Reward Credited!',
      `Congratulations! You earned +${rewardCoins} coins for completing "${offer.title}".`,
      'success'
    );

    this.persist();
    return { success: true, rewardCoins };
  }

  public completeOfferSession(params: {
    userId: number;
    offerId: number;
    trackingToken?: string;
  }): { success: boolean; rewardCoins: number; wallet: Wallet; message: string } {
    const offer = this.getOfferById(params.offerId);
    if (!offer) {
      throw new Error('Offer not found');
    }

    let session = params.trackingToken ? this.getOfferSessionByToken(params.trackingToken) : undefined;
    if (!session) {
      const nextId = this.data.offer_sessions.length > 0 ? Math.max(...this.data.offer_sessions.map((s) => s.id)) + 1 : 1;
      session = {
        id: nextId,
        tracking_token: params.trackingToken || `trk_${crypto.randomBytes(16).toString('hex')}`,
        user_id: params.userId,
        offer_id: params.offerId,
        provider_id: offer.provider_id || 'internal',
        ip_address: '127.0.0.1',
        user_agent: 'verified_player',
        status: 'COMPLETED',
        started_at: new Date(Date.now() - 30000).toISOString(),
        completed_at: new Date().toISOString(),
      };
      this.data.offer_sessions.push(session);
    } else {
      session.status = 'COMPLETED';
      session.completed_at = new Date().toISOString();
    }

    // Record conversion for analytics
    const nextConvId = this.data.conversions.length > 0 ? Math.max(...this.data.conversions.map((c) => c.id)) + 1 : 1;
    this.data.conversions.push({
      id: nextConvId,
      conversion_id: `conv_${params.offerId}_${Date.now()}`,
      tracking_token: session.tracking_token,
      user_id: params.userId,
      offer_id: params.offerId,
      provider_id: offer.provider_id || 'cpagrip',
      payout_usd: Number((offer.reward_coins / 1000).toFixed(2)),
      reward_coins: offer.reward_coins,
      owner_profit_usd: Number(((offer.reward_coins / 1000) * 0.4).toFixed(3)),
      status: 'VERIFIED',
      ip_address: '127.0.0.1',
      raw_payload: JSON.stringify({ verified: true, method: 'verified_complete' }),
      created_at: new Date().toISOString(),
    });

    // Credit user wallet atomically
    const { wallet } = this.creditUserWallet(
      params.userId,
      offer.reward_coins,
      'OFFER_REWARD',
      `offer_comp_${offer.id}_${Date.now()}`,
      `Completed: ${offer.title}`
    );

    // Referral commission if user was referred
    const user = this.getUserById(params.userId);
    if (user && user.referred_by_id) {
      const commissionPercent = this.data.site_settings.referral_commission_percent || 10;
      const commissionCoins = Math.floor((offer.reward_coins * commissionPercent) / 100);
      if (commissionCoins > 0) {
        this.creditUserWallet(
          user.referred_by_id,
          commissionCoins,
          'REFERRAL_REWARD',
          `ref_comm_${user.id}_${Date.now()}`,
          `Referral Commission (${commissionPercent}%) from ${user.name}`
        );
        const refRecord = this.data.referrals.find(
          (r) => r.referrer_user_id === user.referred_by_id && r.referee_user_id === user.id
        );
        if (refRecord) {
          refRecord.bonus_awarded_coins += commissionCoins;
        }
      }
    }

    this.addNotification(
      params.userId,
      'Task Reward Deposited!',
      `You earned +${offer.reward_coins} coins for completing "${offer.title}". Balance updated.`,
      'success'
    );

    this.persist();
    return {
      success: true,
      rewardCoins: offer.reward_coins,
      wallet,
      message: `Successfully credited ${offer.reward_coins} coins!`,
    };
  }

  // --- Withdrawals ---
  public createWithdrawalRequest(params: {
    userId: number;
    amountCoins: number;
    method: 'UPI' | 'PAYPAL' | 'BANK_TRANSFER' | 'CRYPTO';
    paymentDetails: string;
  }): Withdrawal {
    const minCoins = this.data.site_settings.min_withdrawal_coins;
    if (params.amountCoins < minCoins) {
      throw new Error(`Minimum withdrawal is ${minCoins} coins ($${(minCoins / this.data.site_settings.coin_exchange_rate).toFixed(2)})`);
    }

    const wallet = this.getWalletByUserId(params.userId);
    if (wallet.balance_coins < params.amountCoins) {
      throw new Error(`Insufficient coins. Your balance: ${wallet.balance_coins}, requested: ${params.amountCoins}`);
    }

    // Duplicate submit protection: Prevent double-clicking within 2 minutes for same amount
    const recentDuplicate = this.data.withdrawals.find(
      (w) =>
        w.user_id === params.userId &&
        w.status === 'PENDING' &&
        w.amount_coins === params.amountCoins &&
        Date.now() - new Date(w.requested_at).getTime() < 120000
    );
    if (recentDuplicate) {
      throw new Error('A matching withdrawal request is already pending. Please wait for processing before submitting again.');
    }

    // Deduct coins from balance and record in ledger
    const nextId = this.data.withdrawals.length > 0 ? Math.max(...this.data.withdrawals.map((w) => w.id)) + 1 : 1;
    const fiatAmount = Number((params.amountCoins / this.data.site_settings.coin_exchange_rate).toFixed(2));

    this.debitUserWallet(
      params.userId,
      params.amountCoins,
      'WITHDRAWAL',
      `wdr_${nextId}`,
      `Withdrawal Request (${params.method}): $${fiatAmount} ${this.data.site_settings.currency}`
    );

    const withdrawal: Withdrawal = {
      id: nextId,
      user_id: params.userId,
      amount_coins: params.amountCoins,
      amount_fiat: fiatAmount,
      currency: this.data.site_settings.currency,
      method: params.method,
      payment_details: params.paymentDetails,
      status: 'PENDING',
      admin_note: null,
      transaction_ref: null,
      requested_at: new Date().toISOString(),
      processed_at: null,
    };

    this.data.withdrawals.unshift(withdrawal);

    this.addNotification(
      params.userId,
      'Withdrawal Request Submitted',
      `Your payout request for $${fiatAmount} via ${params.method} is under review.`,
      'info'
    );

    this.persist();
    return withdrawal;
  }

  public getWithdrawals(userId?: number): Withdrawal[] {
    if (userId) {
      return this.data.withdrawals.filter((w) => w.user_id === userId);
    }
    return [...this.data.withdrawals];
  }

  public getWithdrawalById(id: number): Withdrawal | undefined {
    return this.data.withdrawals.find((w) => w.id === id);
  }

  public approveWithdrawal(id: number, transactionRef: string, note?: string): Withdrawal {
    const w = this.getWithdrawalById(id);
    if (!w) throw new Error('Withdrawal request not found');
    if (w.status !== 'PENDING' && w.status !== 'PROCESSING') {
      throw new Error(`Cannot approve withdrawal with status: ${w.status}`);
    }

    w.status = 'PAID';
    w.transaction_ref = transactionRef;
    w.admin_note = note || 'Approved and processed successfully';
    w.processed_at = new Date().toISOString();

    const wallet = this.getWalletByUserId(w.user_id);
    wallet.lifetime_withdrawals_coins += w.amount_coins;

    this.addNotification(
      w.user_id,
      'Withdrawal Approved & Paid!',
      `Your withdrawal of $${w.amount_fiat} (${w.method}) has been paid! Ref: ${transactionRef}`,
      'success'
    );

    this.persist();
    return w;
  }

  public rejectWithdrawal(id: number, reason: string): Withdrawal {
    const w = this.getWithdrawalById(id);
    if (!w) throw new Error('Withdrawal request not found');
    if (w.status !== 'PENDING' && w.status !== 'PROCESSING') {
      throw new Error(`Cannot reject withdrawal with status: ${w.status}`);
    }

    w.status = 'REJECTED';
    w.admin_note = reason || 'Declined by admin review';
    w.processed_at = new Date().toISOString();

    // Reversal: Credit coins back into wallet
    this.creditUserWallet(
      w.user_id,
      w.amount_coins,
      'WITHDRAWAL_REVERSAL',
      `wdr_rev_${w.id}`,
      `Withdrawal Refund: ${reason}`
    );

    this.addNotification(
      w.user_id,
      'Withdrawal Rejected - Coins Refunded',
      `Your withdrawal request was rejected (${reason}). ${w.amount_coins} coins have been refunded to your wallet balance.`,
      'warning'
    );

    this.persist();
    return w;
  }

  // --- Daily Bonus ---
  public claimDailyBonus(userId: number): { bonusCoins: number; streakDay: number; nextClaimAvailableAt: string } {
    const now = new Date();
    const userBonuses = this.data.daily_bonuses.filter((b) => b.user_id === userId);
    userBonuses.sort((a, b) => new Date(b.claimed_at).getTime() - new Date(a.claimed_at).getTime());

    const lastBonus = userBonuses[0];
    let streak = 1;

    if (lastBonus) {
      const lastClaimTime = new Date(lastBonus.claimed_at).getTime();
      const diffMs = now.getTime() - lastClaimTime;
      const hoursSinceLast = diffMs / (1000 * 3600);

      // Must wait at least 20 hours (to allow once per calendar day)
      if (hoursSinceLast < 20) {
        const remainingHours = Math.ceil(20 - hoursSinceLast);
        throw new Error(`Daily bonus already claimed. Please return in ${remainingHours} hour(s).`);
      }

      // If within 48 hours, advance streak; else streak resets to 1
      if (hoursSinceLast <= 48) {
        streak = Math.min((lastBonus.streak_day || 1) + 1, this.data.site_settings.daily_bonus_max_streak || 7);
      } else {
        streak = 1;
      }
    }

    const base = this.data.site_settings.daily_bonus_base_coins;
    const increment = this.data.site_settings.daily_bonus_streak_increment;
    const bonusCoins = base + (streak - 1) * increment;

    const nextId = this.data.daily_bonuses.length > 0 ? Math.max(...this.data.daily_bonuses.map((b) => b.id)) + 1 : 1;
    this.data.daily_bonuses.push({
      id: nextId,
      user_id: userId,
      amount_coins: bonusCoins,
      streak_day: streak,
      claimed_at: now.toISOString(),
    });

    this.creditUserWallet(
      userId,
      bonusCoins,
      'DAILY_BONUS',
      `daily_${nextId}`,
      `Day ${streak} Daily Streak Login Bonus`
    );

    this.addNotification(
      userId,
      'Daily Bonus Claimed!',
      `You claimed your Day ${streak} streak bonus of +${bonusCoins} coins! Keep logging in daily!`,
      'success'
    );

    this.persist();
    const nextClaim = new Date(now.getTime() + 20 * 3600 * 1000).toISOString();
    return { bonusCoins, streakDay: streak, nextClaimAvailableAt: nextClaim };
  }

  public getDailyBonusStatus(userId: number): {
    canClaim: boolean;
    currentStreak: number;
    nextRewardCoins: number;
    hoursUntilNextClaim: number;
  } {
    const userBonuses = this.data.daily_bonuses.filter((b) => b.user_id === userId);
    userBonuses.sort((a, b) => new Date(b.claimed_at).getTime() - new Date(a.claimed_at).getTime());

    const last = userBonuses[0];
    const base = this.data.site_settings.daily_bonus_base_coins;
    const increment = this.data.site_settings.daily_bonus_streak_increment;

    if (!last) {
      return {
        canClaim: true,
        currentStreak: 0,
        nextRewardCoins: base,
        hoursUntilNextClaim: 0,
      };
    }

    const diffHours = (Date.now() - new Date(last.claimed_at).getTime()) / (1000 * 3600);
    if (diffHours < 20) {
      const nextStreak = Math.min((last.streak_day || 1) + 1, 7);
      return {
        canClaim: false,
        currentStreak: last.streak_day,
        nextRewardCoins: base + (nextStreak - 1) * increment,
        hoursUntilNextClaim: Math.ceil(20 - diffHours),
      };
    }

    const nextStreak = diffHours <= 48 ? Math.min((last.streak_day || 1) + 1, 7) : 1;
    return {
      canClaim: true,
      currentStreak: diffHours <= 48 ? last.streak_day : 0,
      nextRewardCoins: base + (nextStreak - 1) * increment,
      hoursUntilNextClaim: 0,
    };
  }

  // --- Referrals ---
  public getReferralsByUser(userId: number): {
    referrals: Referral[];
    totalReferrals: number;
    activeReferrals: number;
    totalEarnedCoins: number;
    referralCode: string;
  } {
    const user = this.getUserById(userId);
    const referrals = this.data.referrals.filter((r) => r.referrer_user_id === userId);
    const totalEarnedCoins = referrals.reduce((sum, r) => sum + r.bonus_awarded_coins, 0);

    return {
      referrals,
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter((r) => r.status === 'ACTIVE').length,
      totalEarnedCoins,
      referralCode: user ? user.referral_code : '',
    };
  }

  // --- Fraud & Risk ---
  public logFraudFlag(userId: number, reason: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', details: string): FraudFlag {
    const nextId = this.data.fraud_flags.length > 0 ? Math.max(...this.data.fraud_flags.map((f) => f.id)) + 1 : 1;
    const flag: FraudFlag = {
      id: nextId,
      user_id: userId,
      reason,
      severity,
      details,
      resolved: false,
      created_at: new Date().toISOString(),
    };
    this.data.fraud_flags.unshift(flag);

    // Increase risk score
    const user = this.getUserById(userId);
    if (user) {
      const increment = severity === 'CRITICAL' ? 50 : severity === 'HIGH' ? 30 : severity === 'MEDIUM' ? 15 : 5;
      user.risk_score = Math.min(100, user.risk_score + increment);
    }

    this.persist();
    return flag;
  }

  public getFraudFlags(): FraudFlag[] {
    return [...this.data.fraud_flags];
  }

  public resolveFraudFlag(id: number): boolean {
    const flag = this.data.fraud_flags.find((f) => f.id === id);
    if (flag) {
      flag.resolved = true;
      this.persist();
      return true;
    }
    return false;
  }

  // --- Notifications ---
  public addNotification(userId: number, title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info'): InAppNotification {
    const notif: InAppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.persist();
    return notif;
  }

  public getNotifications(userId: number): InAppNotification[] {
    return this.data.notifications.filter((n) => n.user_id === userId).slice(0, 30);
  }

  public markNotificationAsRead(id: string, userId: number): boolean {
    const notif = this.data.notifications.find((n) => n.id === id && n.user_id === userId);
    if (notif) {
      notif.read = true;
      this.persist();
      return true;
    }
    return false;
  }

  public markAllNotificationsAsRead(userId: number): boolean {
    this.data.notifications.forEach((n) => {
      if (n.user_id === userId) n.read = true;
    });
    this.persist();
    return true;
  }

  // --- Settings ---
  public getSiteSettings(): SiteSettings {
    return { ...this.data.site_settings };
  }

  public updateSiteSettings(settings: Partial<SiteSettings>): SiteSettings {
    Object.assign(this.data.site_settings, settings);
    this.persist();
    return this.getSiteSettings();
  }

  public getProviderSettings(): ProviderSettings[] {
    return [...this.data.provider_settings];
  }

  public updateProviderSettings(id: number, updates: Partial<ProviderSettings>): ProviderSettings {
    const prov = this.data.provider_settings.find((p) => p.id === id);
    if (!prov) throw new Error('Provider setting not found');
    Object.assign(prov, updates, { updated_at: new Date().toISOString() });
    this.persist();
    return prov;
  }

  // --- Analytics for Admin ---
  public getAdminAnalytics() {
    const totalUsers = this.data.users.length;
    const activeUsers = this.data.users.filter((u) => !u.is_suspended).length;
    const suspiciousUsers = this.data.users.filter((u) => u.risk_score >= 40).length;

    const totalRewardsIssuedCoins = this.data.transactions
      .filter((t) => t.type === 'OFFER_REWARD' || t.type === 'DAILY_BONUS' || t.type === 'REFERRAL_REWARD')
      .reduce((sum, t) => sum + t.amount_coins, 0);

    const pendingWithdrawalsCount = this.data.withdrawals.filter((w) => w.status === 'PENDING').length;
    const totalPaidWithdrawalsFiat = this.data.withdrawals
      .filter((w) => w.status === 'PAID')
      .reduce((sum, w) => sum + w.amount_fiat, 0);

    const totalConversions = this.data.conversions.length;
    const grossRevenueUsd = this.data.conversions.reduce((sum, c) => sum + (c.payout_usd || 0), 0);
    const userPayoutValueUsd = totalRewardsIssuedCoins / this.data.site_settings.coin_exchange_rate;

    const cpagripSetting = this.data.provider_settings.find((p) => p.provider_name === 'cpagrip');
    const userShareMargin = cpagripSetting?.default_reward_margin_percent ?? 60;
    const ownerProfitMarginPercent = 100 - userShareMargin;

    // Calculate actual owner net profit from conversions
    const totalOwnerProfitUsd = this.data.conversions.reduce((sum, c) => {
      if (typeof c.owner_profit_usd === 'number') return sum + c.owner_profit_usd;
      const gross = c.payout_usd || (c.reward_coins / this.data.site_settings.coin_exchange_rate);
      return sum + (gross * (ownerProfitMarginPercent / 100));
    }, 0);

    const estimatedProfitUsd = Math.max(0, totalOwnerProfitUsd > 0 ? totalOwnerProfitUsd : (grossRevenueUsd - userPayoutValueUsd));

    // Group conversions by day for charts
    const dailyMap: { [day: string]: { conversions: number; rewards: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      dailyMap[d] = { conversions: 0, rewards: 0 };
    }

    this.data.conversions.forEach((c) => {
      const day = c.created_at.split('T')[0];
      if (dailyMap[day]) {
        dailyMap[day].conversions += 1;
        dailyMap[day].rewards += c.reward_coins;
      }
    });

    const chartData = Object.keys(dailyMap).map((date) => ({
      date,
      conversions: dailyMap[date].conversions,
      rewardsCoins: dailyMap[date].rewards,
    }));

    return {
      totalUsers,
      activeUsers,
      suspiciousUsers,
      totalRewardsIssuedCoins,
      totalConversions,
      pendingWithdrawalsCount,
      totalPaidWithdrawalsFiat,
      grossRevenueUsd: Number(grossRevenueUsd.toFixed(2)),
      estimatedProfitUsd: Number(estimatedProfitUsd.toFixed(2)),
      totalOwnerProfitUsd: Number(estimatedProfitUsd.toFixed(2)),
      ownerProfitMarginPercent,
      userRewardSharePercent: userShareMargin,
      conversionRate: totalUsers > 0 ? Number(((totalConversions / totalUsers) * 100).toFixed(1)) : 0,
      chartData,
    };
  }

  public clearTestConversions(): void {
    this.data.conversions = [];
    this.persist();
  }
}

export const db = new Database();
