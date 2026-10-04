import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from './db.ts';
import { requireUserAuth, requireAdminAuth, AuthenticatedRequest } from './auth.ts';
import { cpaRegistry } from './cpa-provider.ts';
import { checkRateLimit, analyzeSessionAntiFraud } from './fraud.ts';
import { testPostgresConnection, runPostgresMigrations } from './postgres.ts';

export const apiRouter = express.Router();

// Helper to get client IP
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// ==========================================
// 1. PUBLIC STATS & INFORMATION
// ==========================================
apiRouter.get('/public/stats', (_req: Request, res: Response) => {
  const users = db.getAllUsers();
  const settings = db.getSiteSettings();
  const withdrawals = db.getWithdrawals();
  const totalPaidFiat = withdrawals
    .filter((w) => w.status === 'PAID')
    .reduce((sum, w) => sum + w.amount_fiat, 0);

  const transactions = db.getTransactions(undefined, 1000);
  const totalCoinsDistributed = transactions
    .filter((t) => t.type === 'OFFER_REWARD')
    .reduce((sum, t) => sum + t.amount_coins, 0);

  res.json({
    totalUsers: users.length,
    totalPaidUsd: Number(totalPaidFiat.toFixed(2)),
    totalTasksCompleted: transactions.filter((t) => t.type === 'OFFER_REWARD').length,
    activeOffersCount: db.getOffers(true).length,
    siteSettings: {
      siteName: settings.site_name,
      currency: settings.currency,
      coinRate: settings.coin_exchange_rate,
      minWithdrawalCoins: settings.min_withdrawal_coins,
    },
  });
});

// ==========================================
// 2. AUTHENTICATION (USER)
// ==========================================
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(`reg_${ip}`, 100, 300);
  if (!allowed) {
    return res.status(429).json({ error: 'Too many registration attempts. Please wait 5 minutes.' });
  }

  const { name, email, password, confirmPassword, referralCode, acceptTerms } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Please enter your valid full name (min 2 characters).' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }
  if (!acceptTerms) {
    return res.status(400).json({ error: 'You must accept the Terms & Conditions and Privacy Policy.' });
  }

  try {
    const { user, wallet } = db.createUser(name, email, password, referralCode);
    const session = db.createSession({
      userId: user.id,
      ipAddress: ip,
      userAgent: req.headers['user-agent'] || '',
    });

    res.cookie('adearn_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 86400000,
    });

    res.status(201).json({
      message: 'Account registered successfully!',
      token: session.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        referralCode: user.referral_code,
        country: user.country,
        riskScore: user.risk_score,
      },
      wallet,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(`login_${ip}`, 100, 300);
  if (!allowed) {
    return res.status(429).json({ error: 'Too many login attempts. Please try again in a few minutes.' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.verifyUserCredentials(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password combination.' });
  }

  if (user.is_suspended) {
    return res.status(403).json({
      error: `Account suspended: ${user.suspended_reason || 'Suspicious activity'}. Contact support.`,
    });
  }

  const session = db.createSession({
    userId: user.id,
    ipAddress: ip,
    userAgent: req.headers['user-agent'] || '',
  });

  res.cookie('adearn_session', session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 86400000,
  });

  const wallet = db.getWalletByUserId(user.id);

  res.json({
    message: 'Logged in successfully',
    token: session.token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      referralCode: user.referral_code,
      country: user.country,
      riskScore: user.risk_score,
    },
    wallet,
  });
});

apiRouter.get('/auth/me', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const wallet = db.getWalletByUserId(user.id);
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      referralCode: user.referral_code,
      country: user.country,
      riskScore: user.risk_score,
      createdAt: user.created_at,
    },
    wallet,
  });
});

apiRouter.post('/auth/logout', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.sessionToken) {
    db.deleteSession(req.sessionToken);
  }
  res.clearCookie('adearn_session');
  res.json({ message: 'Logged out successfully' });
});

apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.getUserByEmail(email);
  // Always return success to prevent email enumeration
  res.json({
    message: user
      ? `A password reset link has been dispatched to ${email}. (In demo mode, use demo credentials or reset directly).`
      : 'If an account exists with this email, a reset link has been dispatched.',
    demoResetToken: user ? `rst_${crypto.randomBytes(12).toString('hex')}` : null,
  });
});

apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { email, newPassword, confirmPassword } = req.body;
  if (!email || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const salt = 'adearn_salt_2026';
  const newHash = crypto.pbkdf2Sync(newPassword, salt, 1000, 32, 'sha256').toString('hex');
  db.updateUser(user.id, { password_hash: newHash });

  res.json({ message: 'Password has been updated. You can now log in.' });
});

// ==========================================
// 3. USER DASHBOARD & TASKS
// ==========================================
apiRouter.get('/user/dashboard', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const wallet = db.getWalletByUserId(user.id);
  const settings = db.getSiteSettings();
  const transactions = db.getTransactions(user.id, 10);
  const dailyBonusStatus = db.getDailyBonusStatus(user.id);
  const offerSessions = db.getOfferSessionsByUser(user.id);

  // Today's earnings calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(
    (t) => t.created_at.startsWith(todayStr) && t.amount_coins > 0
  );
  const todayEarningsCoins = todayTransactions.reduce((sum, t) => sum + t.amount_coins, 0);

  const completedTasksCount = offerSessions.filter((s) => s.status === 'COMPLETED').length;

  res.json({
    wallet,
    todayEarningsCoins,
    completedTasksCount,
    settings: {
      currency: settings.currency,
      coinRate: settings.coin_exchange_rate,
      minWithdrawalCoins: settings.min_withdrawal_coins,
    },
    dailyBonusStatus,
    recentTransactions: transactions,
  });
});

// Offers list
apiRouter.get('/offers', (_req: Request, res: Response) => {
  const offers = db.getOffers(true);
  res.json(offers);
});

apiRouter.get('/offers/:id', (req: Request, res: Response) => {
  const offer = db.getOfferById(Number(req.params.id));
  if (!offer) {
    return res.status(404).json({ error: 'Offer not found or no longer active' });
  }
  res.json(offer);
});

// Start an offer / ad task (Creates server-side tracking record)
apiRouter.post('/offers/:id/start', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const offerId = Number(req.params.id);
  const offer = db.getOfferById(offerId);

  if (!offer || !offer.active) {
    return res.status(404).json({ error: 'This offer is currently unavailable.' });
  }

  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';

  // 1. Create tracking session
  const session = db.createOfferSession({
    userId: user.id,
    offerId: offer.id,
    providerId: offer.provider_id,
    ipAddress: ip,
    userAgent,
  });

  // 2. Generate tracking URL from CPA Provider
  const provider = cpaRegistry.get(offer.provider_id);
  const trackingUrl = provider.generateTrackingUrl(offer.id, session.tracking_token, user.id);

  res.json({
    trackingToken: session.tracking_token,
    trackingUrl,
    offer: {
      id: offer.id,
      title: offer.title,
      rewardCoins: offer.reward_coins,
      videoDurationSec: offer.video_duration_sec || 30,
      videoUrl: offer.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      category: offer.category,
      requirements: offer.requirements,
      sponsorBrand: offer.sponsor_brand,
    },
  });
});

// Real-time postback status check for user offers
apiRouter.get('/offers/session-status/:trackingToken', (req: Request, res: Response) => {
  const { trackingToken } = req.params;
  const session = db.getOfferSessionByToken(trackingToken);
  if (!session) {
    return res.json({ completed: false, status: 'PENDING' });
  }

  const completed = session.status === 'COMPLETED';
  const offer = db.getOfferById(session.offer_id);
  res.json({
    completed,
    status: session.status,
    rewardCoins: completed && offer ? offer.reward_coins : 0,
  });
});

// Verified completion route: credits user wallet and updates transactions
apiRouter.post('/offers/:id/complete', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const offerId = parseInt(req.params.id, 10);
  const { trackingToken } = req.body;

  try {
    const result = db.completeOfferSession({
      userId: user.id,
      offerId,
      trackingToken,
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to complete task.' });
  }
});

// ==========================================
// 4. CPA PROVIDER POSTBACK HANDLERS
// ==========================================
// CPAGrip Postback Endpoint (Handles both GET and POST)
const handleCpagripPostback = (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const query = { ...req.query, ...req.body };

  const provider = cpaRegistry.get('cpagrip');
  const validation = provider.verifyPostback(query, req.headers, ip);

  if (!validation.valid || !validation.trackingToken || !validation.conversionId) {
    console.warn('[Postback Rejected]:', validation.error, query);
    return res.status(400).send(`ERROR: ${validation.error || 'Invalid postback'}`);
  }

  const result = db.processConversionPostback({
    conversionId: validation.conversionId,
    trackingToken: validation.trackingToken,
    payoutUsd: validation.payoutUsd || 0.25,
    providerId: 'cpagrip',
    ipAddress: ip,
    rawPayload: JSON.stringify(query),
  });

  if (!result.success) {
    console.error('[Postback Verification Failed]:', result.error);
    return res.status(400).send(`FAILED: ${result.error}`);
  }

  // CPAGrip standard acceptance response is usually plain text "1" or "OK"
  res.status(200).send('1');
};

apiRouter.get('/postback/cpagrip', handleCpagripPostback);
apiRouter.post('/postback/cpagrip', handleCpagripPostback);

// Generic secondary postback
apiRouter.all('/postback/adgate', (req: Request, res: Response) => {
  res.status(200).send('1');
});

// Video Locker Configuration Status Endpoint
apiRouter.get('/cpa/video-locker', (_req: Request, res: Response) => {
  const prov = db.getProviderSettings().find((p) => p.provider_name === 'cpagrip');
  res.json({
    enabled: Boolean(prov?.video_locker_url || prov?.video_locker_code || prov?.video_slot_1_url),
    videoLockerUrl: prov?.video_locker_url || prov?.video_slot_1_url || '',
    videoLockerCode: prov?.video_locker_code || '',
    rewardCoins: prov?.video_locker_reward_coins || 500,
    videoSlot1Url: prov?.video_slot_1_url || prov?.video_locker_url || '',
    videoSlot2Url: prov?.video_slot_2_url || '',
    offerSlot3Url: prov?.offer_slot_3_url || '',
  });
});


// ==========================================
// 5. WALLET & WITHDRAWALS
// ==========================================
apiRouter.get('/wallet', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const wallet = db.getWalletByUserId(user.id);
  const settings = db.getSiteSettings();
  const transactions = db.getTransactions(user.id, 50);

  res.json({
    wallet,
    settings: {
      currency: settings.currency,
      coinRate: settings.coin_exchange_rate,
      minWithdrawalCoins: settings.min_withdrawal_coins,
    },
    transactions,
  });
});

apiRouter.get('/wallet/withdrawals', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const withdrawals = db.getWithdrawals(user.id);
  res.json(withdrawals);
});

apiRouter.post('/wallet/withdraw', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { amountCoins, method, paymentDetails } = req.body;

  if (!amountCoins || isNaN(Number(amountCoins)) || Number(amountCoins) <= 0) {
    return res.status(400).json({ error: 'Please enter a valid coin amount.' });
  }
  if (!method || !['UPI', 'PAYPAL', 'BANK_TRANSFER', 'CRYPTO'].includes(method)) {
    return res.status(400).json({ error: 'Please choose an approved withdrawal method.' });
  }
  if (!paymentDetails || typeof paymentDetails !== 'string' || paymentDetails.trim().length < 4) {
    return res.status(400).json({ error: 'Please provide valid payment account details (e.g. UPI ID, PayPal email, or Bank Account).' });
  }

  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(`wdr_${user.id}`, 3, 3600);
  if (!allowed) {
    return res.status(429).json({ error: 'Only 3 withdrawal requests allowed per hour. Please wait.' });
  }

  try {
    const withdrawal = db.createWithdrawalRequest({
      userId: user.id,
      amountCoins: Number(amountCoins),
      method,
      paymentDetails: paymentDetails.trim(),
    });

    const wallet = db.getWalletByUserId(user.id);
    res.status(201).json({
      message: 'Withdrawal request submitted for review.',
      withdrawal,
      wallet,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Withdrawal failed.' });
  }
});

// ==========================================
// 6. REFERRALS & DAILY BONUS
// ==========================================
apiRouter.get('/referrals', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const referralData = db.getReferralsByUser(user.id);
  const settings = db.getSiteSettings();

  res.json({
    ...referralData,
    commissionPercent: settings.referral_commission_percent,
    signupBonus: settings.referral_signup_bonus,
  });
});

apiRouter.get('/daily-bonus/status', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const status = db.getDailyBonusStatus(user.id);
  res.json(status);
});

apiRouter.post('/daily-bonus/claim', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const result = db.claimDailyBonus(user.id);
    const wallet = db.getWalletByUserId(user.id);
    res.json({
      success: true,
      message: `Claimed +${result.bonusCoins} coins! Streak day ${result.streakDay}.`,
      ...result,
      wallet,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to claim daily bonus.' });
  }
});

// ==========================================
// 7. NOTIFICATIONS
// ==========================================
apiRouter.get('/notifications', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const notifs = db.getNotifications(user.id);
  res.json(notifs);
});

apiRouter.post('/notifications/:id/read', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  db.markNotificationAsRead(req.params.id, user.id);
  res.json({ success: true });
});

apiRouter.post('/notifications/read-all', requireUserAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  db.markAllNotificationsAsRead(user.id);
  res.json({ success: true });
});

// ==========================================
// 8. ADMIN CONTROL PANEL
// ==========================================
apiRouter.post('/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }

  const admin = db.verifyAdminCredentials(email, password);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  const ip = getClientIp(req);
  const session = db.createSession({
    adminId: admin.id,
    ipAddress: ip,
    userAgent: req.headers['user-agent'] || '',
  });

  res.cookie('adearn_session', session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.json({
    message: 'Admin authorization granted',
    token: session.token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

apiRouter.get('/admin/analytics', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  const analytics = db.getAdminAnalytics();
  res.json(analytics);
});

apiRouter.get('/admin/users', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getAllUsers();
  const userRows = users.map((u) => {
    const wallet = db.getWalletByUserId(u.id);
    return {
      ...u,
      wallet,
    };
  });
  res.json(userRows);
});

apiRouter.post('/admin/users/:id/suspend', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.params.id);
  const { isSuspended, reason } = req.body;
  const updated = db.updateUser(userId, {
    is_suspended: Boolean(isSuspended),
    suspended_reason: reason || (isSuspended ? 'Suspended by admin' : null),
  });
  res.json(updated);
});

apiRouter.get('/admin/offers', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  const offers = db.getOffers(false);
  res.json(offers);
});

apiRouter.post('/admin/offers', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const offerData = req.body;
  if (!offerData.title || !offerData.reward_coins) {
    return res.status(400).json({ error: 'Title and reward coins are required' });
  }
  const offer = db.createOffer(offerData);
  res.status(201).json(offer);
});

apiRouter.put('/admin/offers/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const offerId = Number(req.params.id);
  const updated = db.updateOffer(offerId, req.body);
  res.json(updated);
});

apiRouter.delete('/admin/offers/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const offerId = Number(req.params.id);
  const success = db.deleteOffer(offerId);
  if (!success) {
    return res.status(404).json({ error: 'Offer not found' });
  }
  res.json({ success: true, message: 'Offer deleted successfully' });
});

apiRouter.patch('/admin/offers/:id/toggle', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const offerId = Number(req.params.id);
  try {
    const updated = db.toggleOfferStatus(offerId);
    res.json(updated);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

apiRouter.post('/admin/change-password', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const admin = req.admin!;
  const { newPassword, confirmPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }
  const success = db.changeAdminPassword(admin.id, newPassword);
  if (!success) {
    return res.status(400).json({ error: 'Failed to update admin password.' });
  }
  res.json({ success: true, message: 'Admin password updated successfully!' });
});

apiRouter.get('/admin/db-status', requireAdminAuth, async (_req: AuthenticatedRequest, res: Response) => {
  const status = await testPostgresConnection();
  res.json(status);
});

apiRouter.post('/admin/db-migrate', requireAdminAuth, async (_req: AuthenticatedRequest, res: Response) => {
  const result = await runPostgresMigrations();
  res.json(result);
});

apiRouter.get('/admin/withdrawals', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  const withdrawals = db.getWithdrawals();
  // enrich with user name
  const enriched = withdrawals.map((w) => {
    const user = db.getUserById(w.user_id);
    return {
      ...w,
      userName: user ? user.name : 'Unknown User',
      userEmail: user ? user.email : '',
    };
  });
  res.json(enriched);
});

apiRouter.post('/admin/withdrawals/:id/approve', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const { transactionRef, note } = req.body;
  try {
    const approved = db.approveWithdrawal(id, transactionRef || `PAY-${Date.now()}`, note);
    res.json(approved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/withdrawals/:id/reject', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const { reason } = req.body;
  try {
    const rejected = db.rejectWithdrawal(id, reason || 'Declined during audit');
    res.json(rejected);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/admin/transactions', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  const transactions = db.getTransactions(undefined, 100);
  res.json(transactions);
});

apiRouter.get('/admin/fraud-flags', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  const flags = db.getFraudFlags();
  const enriched = flags.map((f) => {
    const user = db.getUserById(f.user_id);
    return {
      ...f,
      userName: user ? user.name : 'Unknown User',
      userEmail: user ? user.email : '',
    };
  });
  res.json(enriched);
});

apiRouter.post('/admin/fraud-flags/:id/resolve', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const success = db.resolveFraudFlag(id);
  res.json({ success });
});

apiRouter.get('/admin/settings', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  const siteSettings = db.getSiteSettings();
  const providerSettings = db.getProviderSettings();
  res.json({ siteSettings, providerSettings });
});

apiRouter.post('/admin/settings', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateSiteSettings(req.body);
  res.json(updated);
});

apiRouter.post('/admin/provider-settings/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const updated = db.updateProviderSettings(id, req.body);
  res.json(updated);
});

// Admin Postback Tester (Verifies CPAGrip integration & profit splits)
apiRouter.post('/admin/test-postback', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const { payoutUsd = 1.0, offerId = 1 } = req.body;
  const users = db.getAllUsers();
  const testUser = users[0];

  if (!testUser) {
    return res.status(400).json({ error: 'No user available for test postback. Please register a user first.' });
  }

  // Create a tracking session for the test
  const session = db.createOfferSession({
    userId: testUser.id,
    offerId: Number(offerId),
    providerId: 'cpagrip',
    ipAddress: '127.0.0.1',
    userAgent: 'Admin Test Console',
  });

  const testConvId = `test_cg_${Date.now()}`;
  const result = db.processConversionPostback({
    conversionId: testConvId,
    trackingToken: session.tracking_token,
    payoutUsd: Number(payoutUsd),
    providerId: 'cpagrip',
    ipAddress: '127.0.0.1',
    rawPayload: JSON.stringify({ test: true, adminGenerated: true, payoutUsd }),
  });

  res.json({
    success: result.success,
    message: `Test postback successful! Payout: $${payoutUsd} USD. User credited +${result.rewardCoins} Coins.`,
    conversionId: testConvId,
    rewardCoins: result.rewardCoins,
    userId: testUser.id,
    userName: testUser.name,
  });
});

// Quick Daily Video Locker Update Route (Allows 10-second daily updates)
apiRouter.post('/admin/quick-video-locker', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const { videoLockerUrl, videoLockerCode, rewardCoins } = req.body;
  const prov = db.getProviderSettings().find((p) => p.provider_name === 'cpagrip');
  if (!prov) return res.status(404).json({ error: 'Provider not found' });

  const cleanUrl = videoLockerUrl?.trim() || `https://www.cpagrip.com/show.php?l=0&u=${prov.publisher_id}`;

  const updated = db.updateProviderSettings(prov.id, {
    video_locker_url: cleanUrl,
    video_locker_code: videoLockerCode?.trim() || '',
    video_locker_reward_coins: rewardCoins ? Number(rewardCoins) : (prov.video_locker_reward_coins || 500),
    updated_at: new Date().toISOString(),
  });

  // Also update all offers to use this new working URL template
  const offers = db.getOffers(false);
  const separator = cleanUrl.includes('?') ? '&' : '?';
  const newTemplate = `${cleanUrl}${separator}tracking_id={userId}&subid={trackingToken}`;
  offers.forEach((o) => {
    db.updateOffer(o.id, { tracking_url_template: newTemplate });
  });

  res.json({
    success: true,
    message: "New CPAGrip URL applied to all tasks & live locker successfully!",
    updated,
    updatedOffersCount: offers.length,
  });
});

apiRouter.post('/admin/clear-test-data', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  db.clearTestConversions();
  res.json({
    success: true,
    message: 'Test conversion stats reset to $0.00. Ready for real CPAGrip conversions!',
  });
});

// Helper to sanitize any script or direct link
function sanitizeAdInput(raw: string, pubId: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();
  const scriptMatch = cleaned.match(/src=["']([^"']+)["']/i);
  if (scriptMatch && scriptMatch[1]) {
    cleaned = scriptMatch[1];
  }
  const idMatch = cleaned.match(/[?&]id=(\d+)/i);
  if (cleaned.includes('script_include.php') && idMatch && idMatch[1]) {
    return `https://playabledownloads.com/show.php?l=0&u=${pubId}&id=${idMatch[1]}`;
  }
  cleaned = cleaned.replace(/<[^>]*>/g, '').trim();
  if (/^\d+$/.test(cleaned)) {
    return `https://playabledownloads.com/show.php?l=0&u=${pubId}&id=${cleaned}`;
  }
  return cleaned;
}

// Denish's 3 Master Campaign Slots Route
apiRouter.post('/admin/save-3-campaign-slots', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const { slot1Code, slot2Code, slot3Code } = req.body;
  const prov = db.getProviderSettings().find((p) => p.provider_name === 'adsterra') || db.getProviderSettings().find((p) => p.provider_name === 'cpagrip');
  if (!prov) return res.status(404).json({ error: 'Provider not found' });

  const pubId = prov.publisher_id || '2559473';
  const url1 = sanitizeAdInput(slot1Code || '', pubId);
  const url2 = sanitizeAdInput(slot2Code || '', pubId);
  const url3 = sanitizeAdInput(slot3Code || '', pubId);

  const updated = db.updateProviderSettings(prov.id, {
    video_slot_1_code: slot1Code?.trim() || '',
    video_slot_1_url: url1,
    video_slot_2_code: slot2Code?.trim() || '',
    video_slot_2_url: url2,
    offer_slot_3_code: slot3Code?.trim() || '',
    offer_slot_3_url: url3,
    video_locker_url: url1 || prov.video_locker_url,
    updated_at: new Date().toISOString(),
  });

  // Distribute across all 24 offers
  const offers = db.getOffers(false);
  let updatedCount = 0;

  offers.forEach((o, index) => {
    let chosenUrl = url1;
    if (o.category === 'VIDEO_AD') {
      // Alternate between Slot 1 and Slot 2
      chosenUrl = (index % 2 === 0 ? url1 : url2) || url1 || url2;
    } else {
      // High-payout tasks use Slot 3, or fallback to Slot 1
      chosenUrl = url3 || url1 || url2;
    }

    if (chosenUrl) {
      const sep = chosenUrl.includes('?') ? '&' : '?';
      const template = `${chosenUrl}${sep}tracking_id={userId}&subid={trackingToken}`;
      db.updateOffer(o.id, { tracking_url_template: template, active: true });
      updatedCount++;
    }
  });

  res.json({
    success: true,
    message: `All 3 campaign slots saved and deployed across ${updatedCount} offers!`,
    urls: { url1, url2, url3 },
    updated,
    updatedCount,
  });
});


