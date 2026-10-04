# AdEarn Pro - "Watch Ads & Earn" Rewards Platform

**AdEarn Pro** is a modern, production-grade rewarded advertising web application built with React, Node.js + Express, and a relational database architecture.

---

## 🌟 Key Features

1. **Watch & Earn Engine**
   - Verified 15-30s sponsor video ads, mobile app trials, and interactive CPA tasks.
   - Server-side tracking session generation (`/api/offers/:id/start`).
   - Anti-skip playback verification ensuring minimum watch durations are satisfied.
   - Server-side postback conversion verification (`/api/postback/cpagrip`) guaranteeing that rewards are only credited upon authentic network callback signals.

2. **Modular CPA / CPAGrip Provider Integration**
   - Configurable from the Admin Panel.
   - Secure postback handler supporting signature/secret checks.
   - Idempotency deduplication using unique `conversion_id` records.

3. **Integer Coin Wallet & Immutable Ledger**
   - 1,000 Coins = $1.00 USD (configurable by admin).
   - Atomic credit/debit operations preventing double-spending and race conditions.
   - Every balance modification creates an immutable audit record.

4. **Multi-Channel Withdrawal System**
   - Payout channels: **UPI (VPA)**, **PayPal**, **Direct Bank Wire Transfer**, and **Crypto (USDT)**.
   - Enforced 5,000 Coin ($5.00) minimum withdrawal threshold.
   - Automatic coin locking during pending review.
   - Admin approval (records transaction reference) and rejection (triggers automatic wallet reversal).

5. **Daily Streak Bonus & Referral Program**
   - 24-hour daily bonus cooldown with escalating streak rewards (Day 1 to 7).
   - Unique referral links with 1-click copy (`/?ref=CODE`).
   - Configurable 10% lifetime commission on completed tasks.

6. **Anti-Fraud & Abuse Prevention**
   - Tracks IP clustering, completion velocity, and duplicate claims.
   - Fraud risk scoring (0-100) with dedicated Admin Anti-Fraud Center.
   - Flags anomalies without abrupt auto-bans to avoid false positives.

7. **Admin Portal (`/admin`)**
   - Default credentials: `admin@adearn.com` / `Admin123!`
   - Real-time KPI charts and conversion velocity.
   - Full control over Users, Offers, Withdrawals, Transactions, and Platform Settings.

---

## ⚙️ Environment Configuration (`.env`)

```env
# Server URL
APP_URL="https://yourdomain.com"

# Relational Database (PostgreSQL)
# When set, connects to PostgreSQL; otherwise falls back to local ACID JSON database
DATABASE_URL="postgresql://user:password@localhost:5432/adearn_db"

# Session Security Secret
SESSION_SECRET="super-secret-key-32-chars-long"

# CPAGrip Network Configuration
CPAGRIP_API_KEY="your_cpagrip_api_key_here"
CPAGRIP_PUBLISHER_ID="your_publisher_id_here"
CPAGRIP_POSTBACK_SECRET="your_postback_signature_secret"

# Demo Mode (true enables safe testing with simulated conversions)
DEMO_MODE=true
```

---

## 🛠️ PostgreSQL Relational Database Setup

The complete relational PostgreSQL schema is provided at:
```
src/db/schema.sql
```
It defines all 15 relational tables:
- `users`, `admins`, `sessions`, `wallets`, `transactions`, `offers`, `offer_sessions`, `conversions`, `withdrawals`, `referrals`, `daily_bonuses`, `fraud_flags`, `admin_notes`, `site_settings`, `provider_settings`.

To execute against your PostgreSQL instance:
```bash
psql -d adearn_db -f src/db/schema.sql
```

---

## 🚀 CPAGrip Live Postback Configuration

To configure real CPAGrip callbacks:
1. Log into your CPAGrip Publisher Dashboard.
2. Navigate to **Postback Tools** > **Global Postback**.
3. Set your Postback URL to:
   ```
   https://YOUR_DOMAIN/api/postback/cpagrip?subid={subid}&subid2={subid2}&offer_id={offer_id}&payout={payout}&id={id}&key={key}
   ```
4. Set `DEMO_MODE=false` in your `.env` file.
