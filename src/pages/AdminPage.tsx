import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Shield,
  Users,
  PlaySquare,
  ArrowUpRight,
  TrendingUp,
  Settings,
  AlertTriangle,
  Lock,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Edit2,
  DollarSign,
  Coins,
  Send,
  Sliders,
  Sparkles,
  Trash2,
  Database,
  Key,
  Eye,
  EyeOff,
  Flame,
} from 'lucide-react';
import { Logo } from '../components/Logo.tsx';
import type { Admin, Offer, Withdrawal, Transaction, FraudFlag, SiteSettings, ProviderSettings } from '../server/types.ts';

export const AdminPage: React.FC = () => {
  const { admin, loginAdmin, logoutAdmin } = useAuth();

  // Admin login states (Blank for security: strictly authorized only)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'offers' | 'withdrawals' | 'transactions' | 'fraud' | 'settings' | 'database' | 'security'>('analytics');

  // Analytics data
  const [analytics, setAnalytics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [offersList, setOffersList] = useState<Offer[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<Withdrawal[]>([]);
  const [transactionsList, setTransactionsList] = useState<Transaction[]>([]);
  const [fraudFlags, setFraudFlags] = useState<any[]>([]);
  const [settingsData, setSettingsData] = useState<{ siteSettings: SiteSettings; providerSettings: ProviderSettings[] } | null>(null);

  // Search queries
  const [userSearch, setUserSearch] = useState('');

  // Modals & form states
  const [editingOffer, setEditingOffer] = useState<Partial<Offer> | null>(null);
  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [payoutModal, setPayoutModal] = useState<{ id: number; mode: 'approve' | 'reject'; amountFiat: number; method: string } | null>(null);
  const [txRefInput, setTxRefInput] = useState('');
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // CPAGrip & Profit settings states
  const [cpagripPubId, setCpagripPubId] = useState('2559473');
  const [cpagripApiKey, setCpagripApiKey] = useState('cg_feed_key_2559473');
  const [cpagripSecret, setCpagripSecret] = useState('denish_cpagrip_secret');
  const [cpagripRewardMargin, setCpagripRewardMargin] = useState(30); // 30% to user, 70% pure owner profit to Denish
  const [calcOfferPayout, setCalcOfferPayout] = useState(1.0); // Interactive profit simulator

  // Adsterra SmartLink & Video Locker states
  const [cpagripVideoLockerCode, setCpagripVideoLockerCode] = useState('');
  const [cpagripVideoLockerUrl, setCpagripVideoLockerUrl] = useState(
    'https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed'
  );
  const [cpagripVideoLockerReward, setCpagripVideoLockerReward] = useState(500);
  const [quickLockerUpdating, setQuickLockerUpdating] = useState(false);
  const [quickLockerToast, setQuickLockerToast] = useState<string | null>(null);
  const [lastLockerUpdatedAt, setLastLockerUpdatedAt] = useState<string>('');

  // Denish's 3 Campaign Slots States (All 3 Slots Adsterra SmartLink Powered)
  const [slot1Input, setSlot1Input] = useState('https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed');
  const [slot2Input, setSlot2Input] = useState('https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed');
  const [slot3Input, setSlot3Input] = useState('https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed');
  const [saving3Slots, setSaving3Slots] = useState(false);
  const [slotsToast, setSlotsToast] = useState<string | null>(null);

  // PostgreSQL Database & Vercel Backend State
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [dbMigrating, setDbMigrating] = useState(false);
  const [dbMigrateResult, setDbMigrateResult] = useState<string | null>(null);

  // Admin Password Management State
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminPasswordSuccess, setAdminPasswordSuccess] = useState<string | null>(null);
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Test postback & copy states
  const [copiedPostback, setCopiedPostback] = useState(false);
  const [testPayoutAmount, setTestPayoutAmount] = useState(1.0);
  const [testingPostback, setTestingPostback] = useState(false);
  const [testPostbackResult, setTestPostbackResult] = useState<any>(null);

  const adminToken = localStorage.getItem('adearn_admin_token');

  // Fetch helper
  const adminFetch = async (endpoint: string, options: RequestInit = {}) => {
    return fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        ...options.headers,
      },
    });
  };

  const loadAllAdminData = async () => {
    if (!adminToken) return;
    try {
      const [anRes, uRes, oRes, wRes, tRes, fRes, sRes, dbRes] = await Promise.all([
        adminFetch('/api/admin/analytics'),
        adminFetch('/api/admin/users'),
        adminFetch('/api/admin/offers'),
        adminFetch('/api/admin/withdrawals'),
        adminFetch('/api/admin/transactions'),
        adminFetch('/api/admin/fraud-flags'),
        adminFetch('/api/admin/settings'),
        adminFetch('/api/admin/db-status'),
      ]);

      if (anRes.ok) setAnalytics(await anRes.json());
      if (uRes.ok) setUsersList(await uRes.json());
      if (oRes.ok) setOffersList(await oRes.json());
      if (wRes.ok) setWithdrawalsList(await wRes.json());
      if (tRes.ok) setTransactionsList(await tRes.json());
      if (fRes.ok) setFraudFlags(await fRes.json());
      if (dbRes?.ok) setDbStatus(await dbRes.json());
      if (sRes.ok) {
        const sData = await sRes.json();
        setSettingsData(sData);
        const cpa = sData.providerSettings?.find((p: any) => p.provider_name === 'cpagrip');
        if (cpa) {
          if (cpa.publisher_id) setCpagripPubId(cpa.publisher_id);
          if (cpa.api_key) setCpagripApiKey(cpa.api_key);
          if (cpa.postback_secret) setCpagripSecret(cpa.postback_secret);
          if (cpa.default_reward_margin_percent) setCpagripRewardMargin(cpa.default_reward_margin_percent);
          if (cpa.video_locker_code) setCpagripVideoLockerCode(cpa.video_locker_code);
          if (cpa.video_locker_url) setCpagripVideoLockerUrl(cpa.video_locker_url);
          if (cpa.video_locker_reward_coins) setCpagripVideoLockerReward(cpa.video_locker_reward_coins);
          if (cpa.video_slot_1_code || cpa.video_slot_1_url) setSlot1Input(cpa.video_slot_1_code || cpa.video_slot_1_url || '');
          if (cpa.video_slot_2_code || cpa.video_slot_2_url) setSlot2Input(cpa.video_slot_2_code || cpa.video_slot_2_url || '');
          if (cpa.offer_slot_3_code || cpa.offer_slot_3_url) setSlot3Input(cpa.offer_slot_3_code || cpa.offer_slot_3_url || '');
        }
      }
    } catch (e) {
      console.error('Error loading admin data:', e);
    }
  };

  useEffect(() => {
    if (admin) {
      loadAllAdminData();
    }
  }, [admin]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);

    try {
      let loggedIn = false;
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Admin credentials incorrect');
          loginAdmin(data.token, data.admin);
          loggedIn = true;
        }
      } catch (networkErr: any) {
        if (networkErr.message && !networkErr.message.includes('Unexpected') && !networkErr.message.includes('JSON')) {
          throw networkErr;
        }
      }

      // Offline / Static host fallback for Master Admin
      if (!loggedIn) {
        if (email.trim().toLowerCase() === 'admin@adearn.com' && password === 'Admin123!') {
          const masterAdmin: Admin = {
            id: 1,
            email: 'admin@adearn.com',
            name: 'Master Admin',
            password_hash: '',
            role: 'superadmin',
            created_at: new Date().toISOString(),
          };
          loginAdmin(`adm_token_${Date.now()}`, masterAdmin);
        } else {
          throw new Error('Invalid admin email or password.');
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'Access denied.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleToggleSuspendUser = async (userId: number, currentSuspended: boolean) => {
    const reason = currentSuspended ? '' : prompt('Reason for suspending user:') || 'Admin policy enforcement';
    try {
      const res = await adminFetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ isSuspended: !currentSuspended, reason }),
      });
      if (res.ok) {
        await loadAllAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer) return;

    try {
      if (editingOffer.id) {
        // Update
        await adminFetch(`/api/admin/offers/${editingOffer.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingOffer),
        });
      } else {
        // Create
        await adminFetch('/api/admin/offers', {
          method: 'POST',
          body: JSON.stringify(editingOffer),
        });
      }
      setEditingOffer(null);
      setShowAddOfferModal(false);
      await loadAllAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOffer = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this offer?')) return;
    try {
      const res = await adminFetch(`/api/admin/offers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAllAdminData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete offer');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleOffer = async (id: number) => {
    try {
      const res = await adminFetch(`/api/admin/offers/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        await loadAllAdminData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to toggle offer');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPasswordError(null);
    setAdminPasswordSuccess(null);
    setChangingPassword(true);

    try {
      const res = await adminFetch('/api/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({
          newPassword: adminNewPassword,
          confirmPassword: adminConfirmPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminPasswordSuccess('✅ Master Admin password updated successfully! Please save it safely.');
        setAdminNewPassword('');
        setAdminConfirmPassword('');
      } else {
        setAdminPasswordError(data.error || 'Failed to update password');
      }
    } catch (err: any) {
      setAdminPasswordError(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRunDbMigration = async () => {
    setDbMigrating(true);
    setDbMigrateResult(null);
    try {
      const res = await adminFetch('/api/admin/db-migrate', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setDbMigrateResult(data.message || 'PostgreSQL tables verified and migrated successfully!');
        const sRes = await adminFetch('/api/admin/db-status');
        if (sRes.ok) setDbStatus(await sRes.json());
      } else {
        setDbMigrateResult(`Error: ${data.message || 'Migration failed'}`);
      }
    } catch (err: any) {
      setDbMigrateResult(`Error: ${err.message}`);
    } finally {
      setDbMigrating(false);
    }
  };

  const handleClearTestData = async () => {
    if (!window.confirm('Reset test conversions to $0.00? This clears simulated test data so you start clean.')) return;
    try {
      const res = await adminFetch('/api/admin/clear-test-data', { method: 'POST' });
      if (res.ok) {
        await loadAllAdminData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleProcessWithdrawal = async () => {
    if (!payoutModal) return;
    try {
      if (payoutModal.mode === 'approve') {
        const res = await adminFetch(`/api/admin/withdrawals/${payoutModal.id}/approve`, {
          method: 'POST',
          body: JSON.stringify({ transactionRef: txRefInput || `TXN-${Date.now()}` }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || 'Failed to approve');
        }
      } else {
        const res = await adminFetch(`/api/admin/withdrawals/${payoutModal.id}/reject`, {
          method: 'POST',
          body: JSON.stringify({ reason: rejectReasonInput || 'Declined by admin audit' }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || 'Failed to reject');
        }
      }
      setPayoutModal(null);
      setTxRefInput('');
      setRejectReasonInput('');
      await loadAllAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveFraudFlag = async (flagId: number) => {
    try {
      await adminFetch(`/api/admin/fraud-flags/${flagId}/resolve`, { method: 'POST' });
      await loadAllAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsData) return;
    try {
      await adminFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(settingsData.siteSettings),
      });
      alert('Site settings updated successfully!');
      await loadAllAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCpaProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminFetch('/api/admin/provider-settings/1', {
        method: 'POST',
        body: JSON.stringify({
          publisher_id: cpagripPubId.trim(),
          api_key: cpagripApiKey.trim(),
          postback_secret: cpagripSecret.trim(),
          default_reward_margin_percent: Number(cpagripRewardMargin),
          video_locker_code: cpagripVideoLockerCode.trim(),
          video_locker_url: cpagripVideoLockerUrl.trim(),
          video_locker_reward_coins: Number(cpagripVideoLockerReward),
        }),
      });
      if (res.ok) {
        alert('CPAGrip credentials, profit margins, and Video Locker saved successfully to database!');
        await loadAllAdminData();
      } else {
        alert('Failed to save CPAGrip settings.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickDailyLockerUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickLockerUpdating(true);
    setQuickLockerToast(null);
    try {
      const res = await adminFetch('/api/admin/quick-video-locker', {
        method: 'POST',
        body: JSON.stringify({
          videoLockerUrl: cpagripVideoLockerUrl,
          videoLockerCode: cpagripVideoLockerCode,
          rewardCoins: cpagripVideoLockerReward,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuickLockerToast("✅ Today's Video Locker code updated successfully! Live on user Earn page.");
        setLastLockerUpdatedAt(new Date().toISOString());
        try {
          localStorage.setItem('cpagrip_video_locker_data', JSON.stringify({
            enabled: true,
            videoLockerUrl: cpagripVideoLockerUrl,
            videoLockerCode: cpagripVideoLockerCode,
            rewardCoins: cpagripVideoLockerReward,
          }));
        } catch {}
        setTimeout(() => setQuickLockerToast(null), 5000);
        await loadAllAdminData();
      } else {
        alert(data.error || 'Failed to update video locker');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setQuickLockerUpdating(false);
    }
  };

  const handleSave3CampaignSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving3Slots(true);
    setSlotsToast(null);
    try {
      const res = await adminFetch('/api/admin/save-3-campaign-slots', {
        method: 'POST',
        body: JSON.stringify({
          slot1Code: slot1Input,
          slot2Code: slot2Input,
          slot3Code: slot3Input,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSlotsToast(`✅ Sabhi 3 Codes successfully save aur ${data.updatedCount || 24} tasks me deploy ho gaye!`);
        setTimeout(() => setSlotsToast(null), 6000);
        await loadAllAdminData();
      } else {
        alert(data.error || 'Failed to save campaign codes');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving3Slots(false);
    }
  };

  const handleSendTestPostback = async () => {
    setTestingPostback(true);
    setTestPostbackResult(null);
    try {
      const res = await adminFetch('/api/admin/test-postback', {
        method: 'POST',
        body: JSON.stringify({ payoutUsd: testPayoutAmount }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestPostbackResult({
          success: true,
          message: data.message,
          rewardCoins: data.rewardCoins,
          payoutUsd: testPayoutAmount,
          ownerProfit: (testPayoutAmount * (1 - cpagripRewardMargin / 100)).toFixed(2),
        });
        await loadAllAdminData();
      } else {
        setTestPostbackResult({
          success: false,
          error: data.error || 'Failed to simulate test postback',
        });
      }
    } catch (err: any) {
      setTestPostbackResult({
        success: false,
        error: err.message,
      });
    } finally {
      setTestingPostback(false);
    }
  };

  // ADMIN LOGIN VIEW
  if (!admin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <Logo size="md" />
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Admin Gateway</h2>
            <p className="text-xs text-slate-400">Strictly authorized platform administrators only.</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs">
              {loginError}
            </div>
          )}

          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Encrypted admin portal. Access is restricted to platform owners.</span>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Security Key / Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {loggingIn ? 'Authenticating...' : 'Sign In to Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD VIEW
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Top Admin Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Admin Operations Center</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold uppercase">
                {admin.role}
              </span>
            </div>
            <p className="text-xs text-slate-400">Signed in as {admin.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllAdminData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh All"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={logoutAdmin}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold rounded-xl border border-red-500/30 transition-colors cursor-pointer"
          >
            Exit Admin
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'analytics', label: 'Analytics & KPIs', icon: TrendingUp },
          { id: 'users', label: 'Users & Wallets', icon: Users },
          { id: 'offers', label: 'CPA Offers & Tasks', icon: PlaySquare },
          { id: 'withdrawals', label: 'Withdrawal Approvals', icon: ArrowUpRight, badge: withdrawalsList.filter((w) => w.status === 'PENDING').length },
          { id: 'transactions', label: 'Audit Ledger', icon: Coins },
          { id: 'fraud', label: 'Anti-Fraud System', icon: AlertTriangle, badge: fraudFlags.filter((f) => !f.resolved).length },
          { id: 'settings', label: '💰 Profit & CPAGrip Setup', icon: Settings },
          { id: 'database', label: '🐘 PostgreSQL DB', icon: Database },
          { id: 'security', label: '🔑 Change Password', icon: Key },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-amber-400 text-slate-950 font-bold shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {Boolean(tab.badge) && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? 'bg-slate-950 text-amber-400' : 'bg-red-500 text-white'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. ANALYTICS TAB */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-xs font-semibold">Total Users</div>
              <div className="text-2xl font-black text-white font-mono mt-1">{analytics.totalUsers}</div>
              <div className="text-[11px] text-emerald-400 mt-1">{analytics.activeUsers} active accounts</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-xs font-semibold">Completed Conversions</div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{analytics.totalConversions}</div>
              <div className="text-[11px] text-slate-400 mt-1">Verified postbacks</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-xs font-semibold">Total Rewards Issued</div>
              <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                {analytics.totalRewardsIssuedCoins.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                ≈ ${(analytics.totalRewardsIssuedCoins / 1000).toFixed(2)} USD
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-xs font-semibold">Pending Withdrawals</div>
              <div className="text-2xl font-black text-red-400 font-mono mt-1">
                {analytics.pendingWithdrawalsCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Awaiting admin sign-off</div>
            </div>
          </div>

          {/* Business Revenue & Net Profit Cards */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-slate-900 to-amber-500/15 border border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span>Platform Revenue & Owner Net Profit</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time profit tracking from CPAGrip advertiser payouts minus user coin disbursements.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearTestData}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] transition-colors cursor-pointer border border-slate-700"
                  title="Clear simulated conversions and start fresh at $0.00"
                >
                  🔄 Reset Stats to $0.00
                </button>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold w-fit">
                  Owner Margin: ~{100 - cpagripRewardMargin}% Pure Profit
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">Total Network Payout (From CPAGrip)</div>
                <div className="text-2xl font-black text-white font-mono mt-1">
                  ${(analytics.grossRevenueUsd || 0).toFixed(2)} USD
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Direct advertiser revenue received</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">User Rewards Distributed (Coins Value)</div>
                <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                  ${((analytics.totalRewardsIssuedCoins || 0) / 1000).toFixed(2)} USD
                </div>
                <div className="text-[10px] text-slate-500 mt-1">User coin claims (1,000 = $1.00)</div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40">
                <div className="text-[11px] text-emerald-300 font-bold">Your Net Cash Profit</div>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                  ${(analytics.estimatedProfitUsd || 0).toFixed(2)} USD
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-1">Pure retained revenue in your pocket</div>
              </div>
            </div>

            {/* Interactive Live Profit Calculator */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Live Offer Profit Simulator:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center bg-slate-950/90 p-3 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">If CPAGrip pays you for an offer:</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0.10"
                      value={calcOfferPayout}
                      onChange={(e) => setCalcOfferPayout(Math.max(0.1, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-6 pr-2 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">User Receives ({cpagripRewardMargin}%):</div>
                  <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">
                    {Math.round(calcOfferPayout * (cpagripRewardMargin / 100) * 1000)} Coins (${(calcOfferPayout * (cpagripRewardMargin / 100)).toFixed(2)})
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                  <div className="text-emerald-300 text-[11px] font-bold">You Keep (Owner Net Profit):</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                    +${(calcOfferPayout * (1 - cpagripRewardMargin / 100)).toFixed(2)} USD ({100 - cpagripRewardMargin}%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7-Day Performance Velocity */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base">7-Day Conversion Velocity</h3>
            <div className="grid grid-cols-7 gap-2 text-center pt-4">
              {analytics.chartData?.map((item: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="h-28 w-full bg-slate-950 rounded-xl p-1 flex items-end justify-center">
                    <div
                      className="w-full bg-gradient-to-t from-amber-500 to-emerald-400 rounded-lg min-h-[4px]"
                      style={{ height: `${Math.min(100, Math.max(8, item.conversions * 20))}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{item.date.slice(5)}</span>
                  <span className="text-[11px] font-bold text-amber-400 font-mono">{item.conversions}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. USERS TAB */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-bold text-white text-base">User Accounts Management ({usersList.length})</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user email, name..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Referral Code</th>
                  <th className="pb-3 font-semibold">Balance</th>
                  <th className="pb-3 font-semibold">Risk Score</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {usersList
                  .filter((u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                  .map((u) => (
                    <tr key={u.id} className="text-slate-300">
                      <td className="py-3">
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-500">{u.email}</div>
                      </td>
                      <td className="py-3 font-mono text-amber-400">{u.referral_code}</td>
                      <td className="py-3 font-mono font-bold text-white">
                        {u.wallet?.balance_coins?.toLocaleString()} Coins
                      </td>
                      <td className="py-3 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.risk_score >= 50
                              ? 'bg-red-500/20 text-red-400'
                              : u.risk_score >= 20
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {u.risk_score}/100
                        </span>
                      </td>
                      <td className="py-3">
                        {u.is_suspended ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                            SUSPENDED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleToggleSuspendUser(u.id, u.is_suspended)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                            u.is_suspended
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                          }`}
                        >
                          {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. OFFERS TAB */}
      {activeTab === 'offers' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">CPA Offers & Video Tasks</h3>
            <button
              onClick={() => {
                setEditingOffer({
                  title: '',
                  description: '',
                  category: 'VIDEO_AD',
                  reward_coins: 100,
                  estimated_minutes: 1,
                  requirements: 'Watch full video.',
                  provider_id: 'cpagrip',
                  external_offer_id: `ext_${Date.now()}`,
                  target_countries: 'ALL',
                  daily_cap: 5,
                  active: true,
                });
                setShowAddOfferModal(true);
              }}
              className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Offer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Title</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Reward</th>
                  <th className="pb-3 font-semibold">Target</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {offersList.map((o) => (
                  <tr key={o.id} className="text-slate-300">
                    <td className="py-3 font-bold text-white">{o.title}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                        {o.category}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-amber-400">+{o.reward_coins} Coins</td>
                    <td className="py-3 text-slate-400">{o.target_countries}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {o.active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleOffer(o.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                            o.active ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                          }`}
                          title={o.active ? 'Disable Offer' : 'Activate Offer'}
                        >
                          {o.active ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingOffer(o);
                            setShowAddOfferModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                          title="Edit Task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(o.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. WITHDRAWALS APPROVAL TAB */}
      {activeTab === 'withdrawals' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-base">Withdrawal Payout Verification Queue</h3>
          <p className="text-xs text-slate-400">
            Review user payout requests. Approving records transaction reference; rejecting automatically refunds coins
            back to the user's wallet ledger.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Method</th>
                  <th className="pb-3 font-semibold">Amount Fiat</th>
                  <th className="pb-3 font-semibold">Payment Details</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {withdrawalsList.map((w: any) => (
                  <tr key={w.id} className="text-slate-300">
                    <td className="py-3">
                      <div className="font-bold text-white">{w.userName || `User #${w.user_id}`}</div>
                      <div className="text-[10px] text-slate-500">{w.userEmail}</div>
                    </td>
                    <td className="py-3 font-mono font-bold text-amber-400">{w.method}</td>
                    <td className="py-3 font-mono font-bold text-emerald-400">${w.amount_fiat} USD</td>
                    <td className="py-3 font-mono text-slate-300 max-w-xs truncate">{w.payment_details}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          w.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : w.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {w.status === 'PENDING' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setPayoutModal({
                                id: w.id,
                                mode: 'approve',
                                amountFiat: w.amount_fiat,
                                method: w.method,
                              })
                            }
                            className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-lg text-[10px] font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              setPayoutModal({
                                id: w.id,
                                mode: 'reject',
                                amountFiat: w.amount_fiat,
                                method: w.method,
                              })
                            }
                            className="px-2.5 py-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg text-[10px] font-bold"
                          >
                            Reject & Refund
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">{w.admin_note || w.transaction_ref}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. AUDIT LEDGER TRANSACTIONS TAB */}
      {activeTab === 'transactions' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-base">Platform Immutable Audit Ledger (Last 100)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">User ID</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Coins Change</th>
                  <th className="pb-3 font-semibold">Balance After</th>
                  <th className="pb-3 font-semibold">Reference</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {transactionsList.map((tx) => (
                  <tr key={tx.id} className="text-slate-300">
                    <td className="py-3 font-mono">User #{tx.user_id}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono">{tx.type}</span>
                    </td>
                    <td className={`py-3 font-mono font-bold ${tx.amount_coins >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.amount_coins >= 0 ? `+${tx.amount_coins}` : tx.amount_coins}
                    </td>
                    <td className="py-3 font-mono text-slate-400">{tx.balance_after_coins.toLocaleString()}</td>
                    <td className="py-3 text-slate-400 truncate max-w-xs">{tx.description}</td>
                    <td className="py-3 text-slate-500 text-[10px]">
                      {new Date(tx.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. ANTI-FRAUD TAB */}
      {activeTab === 'fraud' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Anti-Fraud & Anomaly Detection Center</h3>
          </div>
          <p className="text-xs text-slate-400">
            System automatically analyzes offer completion velocity, IP clustering, and failed conversion attempts.
            Suspicious accounts are flagged without automatic bans to avoid false positives.
          </p>

          {fraudFlags.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">Zero fraud flags active. System is clean.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Severity</th>
                    <th className="pb-3 font-semibold">Anomaly Reason</th>
                    <th className="pb-3 font-semibold">Details</th>
                    <th className="pb-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {fraudFlags.map((flag) => (
                    <tr key={flag.id} className="text-slate-300">
                      <td className="py-3 font-bold text-white">{flag.userName || `User #${flag.user_id}`}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            flag.severity === 'CRITICAL'
                              ? 'bg-red-500 text-white'
                              : flag.severity === 'HIGH'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {flag.severity}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-white">{flag.reason}</td>
                      <td className="py-3 text-slate-400 text-[11px] max-w-sm truncate">{flag.details}</td>
                      <td className="py-3">
                        {flag.resolved ? (
                          <span className="text-[10px] text-emerald-400 font-bold">Resolved</span>
                        ) : (
                          <button
                            onClick={() => handleResolveFraudFlag(flag.id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 7. SETTINGS & CPAGRIP TAB */}
      {activeTab === 'settings' && settingsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Site Settings */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Economy & Currency Settings</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Coin Exchange Rate (Coins per $1.00 USD)</label>
                <input
                  type="number"
                  value={settingsData.siteSettings.coin_exchange_rate}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      siteSettings: {
                        ...settingsData.siteSettings,
                        coin_exchange_rate: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Minimum Withdrawal (Coins)</label>
                <input
                  type="number"
                  value={settingsData.siteSettings.min_withdrawal_coins}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      siteSettings: {
                        ...settingsData.siteSettings,
                        min_withdrawal_coins: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Referral Commission (%)</label>
                <input
                  type="number"
                  value={settingsData.siteSettings.referral_commission_percent}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      siteSettings: {
                        ...settingsData.siteSettings,
                        referral_commission_percent: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs"
              >
                Save Economics
              </button>
            </form>
          </div>

          {/* CPAGrip Integration Config & Step-by-Step Guide */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span>💰 Owner Profit & CPAGrip API Setup Hub</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Aapka profit guarantee rakhne ke liye settings aur CPAGrip API credentials yahan daalein.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
                  Owner Profit Margin: {100 - cpagripRewardMargin}% Pure Cash
                </div>
              </div>
            </div>

            {/* 🎯 DENISH'S 3 MASTER CAMPAIGN SLOTS MANAGER (2 VIDEO + 1 OFFER) */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-indigo-950/60 border-2 border-amber-400/60 shadow-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-400/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-white">🎯 3 Master Campaign Slots (2 Video Codes + 1 Offer Code)</h4>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                        Active Multi-Stream
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Bhai aapke paas jo <b>2 Video Codes</b> aur <b>1 Offer Code</b> hain, unhe yahan daalein. Sabhi 24 tasks me ye 3 codes automatic connect ho jayenge!
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300">
                  Total Active Tasks: 24 Live
                </div>
              </div>

              <form onSubmit={handleSave3CampaignSlots} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Slot 1: Video Code 1 */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <PlaySquare className="w-4 h-4 text-indigo-400" />
                        <span>1. Video Ad Code 1 (Primary)</span>
                      </label>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase">Stream 1</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Pehla video locker link ya script tag (e.g. 1916896)</p>
                    <textarea
                      rows={3}
                      value={slot1Input}
                      onChange={(e) => setSlot1Input(e.target.value)}
                      placeholder="https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Slot 2: Video Code 2 */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-purple-400" />
                        <span>2. Adsterra SmartLink Stream (Stream 2)</span>
                      </label>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold uppercase">Stream 2</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Adsterra Direct Link / SmartLink URL</p>
                    <textarea
                      rows={3}
                      value={slot2Input}
                      onChange={(e) => setSlot2Input(e.target.value)}
                      placeholder="https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Slot 3: Offer Code 3 */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span>3. Adsterra High Payout Stream (Stream 3)</span>
                      </label>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black uppercase">High Payout</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Teesra Adsterra SmartLink / Direct offer URL</p>
                    <textarea
                      rows={3}
                      value={slot3Input}
                      onChange={(e) => setSlot3Input(e.target.value)}
                      placeholder="https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={saving3Slots}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-400/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{saving3Slots ? 'Deploying All 3 Codes...' : '🚀 Save All 3 Codes & Deploy to All 24 Tasks'}</span>
                  </button>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><b>Smart Script Sanitizer:</b> Aap chahe link daalo ya pura <code>&lt;script&gt;</code> code, system apne aap link extract kar lega!</span>
                  </div>
                </div>

                {slotsToast && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{slotsToast}</span>
                  </div>
                )}
              </form>
            </div>

            {/* ⚡ DAILY VIDEO LOCKER QUICK UPDATE (10-Second Update Tool) */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/70 border-2 border-indigo-500/50 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold">
                    <PlaySquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">⚡ Roz Ka Naya Video Locker Code (Daily Quick Update)</h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        10-Second Quick Tool
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      CPAGrip me roz naya code banta hai toh bas yahan paste karke "Update" daba dein. Turant live ho jayega!
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400 font-mono">
                  <span>Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  {lastLockerUpdatedAt && (
                    <div className="text-[10px] text-emerald-400">Updated: {new Date(lastLockerUpdatedAt).toLocaleTimeString()}</div>
                  )}
                </div>
              </div>

              {/* Guide to fix Error Code: 01-((IN) not allowed) */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Fix "Error Code: 01-((IN) not allowed)" (India Users Error):</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Agar aapko ya kisi visitor ko <b>"error Code: 01-((IN) not allowed)"</b> aata hai, iska matlab CPAGrip locker me <b>India ke offers enable nahi hain</b>. Ise 1 minute me theek karein:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                  <li>CPAGrip.com me login karein ➔ <b>"Monetization Tools" ➔ "URL/File Lockers"</b> par click karein.</li>
                  <li>Locker #1916896 ke samne <b>"Edit"</b> dabayein ➔ <b>"Show Offers For:"</b> ko <b>"All Countries"</b> (ya <b>"India"</b>) select karein!</li>
                  <li>Niche <b>"Save"</b> par click karein. Iske baad Indian users ko turant India ke offers milenge!</li>
                </ol>
              </div>

              <form onSubmit={handleQuickDailyLockerUpdate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-200 text-[11px] font-semibold mb-1">
                      Adsterra SmartLink URL (Direct Link):
                    </label>
                    <input
                      type="text"
                      value={cpagripVideoLockerUrl}
                      onChange={(e) => setCpagripVideoLockerUrl(e.target.value)}
                      placeholder="https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed"
                      className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-200 text-[11px] font-semibold mb-1">
                      Coins Reward:
                    </label>
                    <input
                      type="number"
                      value={cpagripVideoLockerReward}
                      onChange={(e) => setCpagripVideoLockerReward(Number(e.target.value))}
                      placeholder="500"
                      className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-200 text-[11px] font-semibold mb-1">
                    Or Adsterra Script / Banner Code (Optional):
                  </label>
                  <input
                    type="text"
                    value={cpagripVideoLockerCode}
                    onChange={(e) => setCpagripVideoLockerCode(e.target.value)}
                    placeholder='<script type="text/javascript" src="https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed"></script>'
                    className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={quickLockerUpdating}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 text-slate-950 font-black rounded-xl text-xs hover:brightness-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{quickLockerUpdating ? 'Updating Live Locker...' : "⚡ Update Adsterra SmartLink Code"}</span>
                  </button>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span><b>Auto-Fallback Protected:</b> Agar kisi din naya code na dalo, tab bhi default locker chalta rahega!</span>
                  </div>
                </div>

                {quickLockerToast && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{quickLockerToast}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Visual Guide: CPAGrip API Code Kahan Hoti Hai? */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Sliders className="w-4 h-4" />
                <span>📘 Bhai CPAGrip Ka Code Kahan Hoti Hai? (Quick Visual Map):</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">1. Publisher ID (Account ID)</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">Top Right</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    <a href="https://www.cpagrip.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">cpagrip.com</a> me login karein. Dashboard ke bilkul top-right header par aapka 5 ya 6 digit Account ID hota hai (jaise <b>104829</b>).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">2. API Key / Feed Key</span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-400/20 text-indigo-300 text-[10px] font-mono font-bold">Offer Tools</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Left menu me <b>"Offer Tools" &gt; "RSS / JSON Feeds"</b> par click karein. Wahan feed URL me <b>key=xxxxxxxx</b> likha hota hai, wahi aapki API key hai.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">3. Global Postback URL</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 text-[10px] font-mono font-bold">Postback Tools</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Left menu me <b>"Postback Tools" &gt; "Global Postback"</b> par jayein. Wahan niche diya gaya Postback URL paste karein.
                  </p>
                </div>
              </div>
            </div>

            {/* Step-by-Step Input Form: Code Kahan Dalu? */}
            <form onSubmit={handleSaveCpaProvider} className="space-y-4 text-xs bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
              <div className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                <span>📝 Code Yahan Dalein (Save Directly to Database):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    1. CPAGrip Publisher ID (Account ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={cpagripPubId}
                    onChange={(e) => setCpagripPubId(e.target.value)}
                    placeholder="e.g. 104829"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400 text-xs"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    CPAGrip account ka publisher number.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    2. CPAGrip API Key / Feed Secret
                  </label>
                  <input
                    type="text"
                    value={cpagripApiKey}
                    onChange={(e) => setCpagripApiKey(e.target.value)}
                    placeholder="e.g. 48f98a2e1d7b3c88a912..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400 text-xs"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Offers sync aur feed access ke liye API key.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  3. Postback Secret Key / Signature (Security Password)
                </label>
                <input
                  type="text"
                  value={cpagripSecret}
                  onChange={(e) => setCpagripSecret(e.target.value)}
                  placeholder="e.g. my_secret_postback_hash"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400 text-xs"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  CPAGrip postback verify karne ke liye secret code (optional, extra security ke liye).
                </span>
              </div>

              {/* Profit Margin Guarantee Slider */}
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <label className="text-white font-bold text-xs">
                      💰 Owner Profit Margin Setting:
                    </label>
                    <span className="text-slate-400 text-[11px] block">
                      Aap kitna % profit apne paas rakhna chahte hain?
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-black font-mono text-base">
                      {100 - cpagripRewardMargin}% Owner Profit
                    </span>
                    <span className="text-amber-400 font-mono text-[11px] block">
                      ({cpagripRewardMargin}% User Coin Share)
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="20"
                  max="80"
                  step="5"
                  value={cpagripRewardMargin}
                  onChange={(e) => setCpagripRewardMargin(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
                />

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="font-bold text-emerald-300">
                    💡 Kaise Profit Banega (How You Earn Profit):
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Jab CPAGrip aapko <b>$1.00 USD</b> lead ka pay karega:
                    User ko <b>{cpagripRewardMargin * 10} Coins (${(cpagripRewardMargin / 100).toFixed(2)} USD value)</b> milenge, aur <b>+${((100 - cpagripRewardMargin) / 100).toFixed(2)} USD (40%)</b> aapka pure net profit CPAGrip me jama ho jayega!
                  </p>
                  <p className="text-slate-400">
                    Jab user $5.00 withdraw karega, aapne pehle hi CPAGrip se ${(5 / (cpagripRewardMargin / 100)).toFixed(2)} USD earn kar liya hoga!
                  </p>
                </div>
              </div>

              {/* CPAGrip Video Locker / Content Locker Section */}
              <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <PlaySquare className="w-4 h-4 text-indigo-400" />
                    <span>🎬 CPAGrip Video Locker & Content Locker Integration:</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                    Optional / High Payout
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  CPAGrip dashboard me <b>"Monetization Tools" &gt; "Video / File Lockers"</b> ya <b>"URL / File Lockers"</b> create karke uska direct link ya embed script code yahan paste karein:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 text-[11px] font-semibold mb-1">
                      Video Locker Direct URL (Recommended):
                    </label>
                    <input
                      type="text"
                      value={cpagripVideoLockerUrl}
                      onChange={(e) => setCpagripVideoLockerUrl(e.target.value)}
                      placeholder="e.g. https://www.cpagrip.com/show.php?l=0&u=104829&id=12345"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-400 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-[11px] font-semibold mb-1">
                      Reward Coins for Completing Locker:
                    </label>
                    <input
                      type="number"
                      value={cpagripVideoLockerReward}
                      onChange={(e) => setCpagripVideoLockerReward(Number(e.target.value))}
                      placeholder="500"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-400 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-[11px] font-semibold mb-1">
                    Or Video Locker Embed Script Tag / HTML Code:
                  </label>
                  <textarea
                    rows={2}
                    value={cpagripVideoLockerCode}
                    onChange={(e) => setCpagripVideoLockerCode(e.target.value)}
                    placeholder='<script type="text/javascript" src="https://www.cpagrip.com/script_include.php?id=..."></script>'
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-400 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-400 via-amber-400 to-amber-500 text-slate-950 font-black rounded-xl text-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-lg"
              >
                💾 Save CPAGrip Credentials & Profit Margin to Database
              </button>
            </form>

            {/* Official Postback URL Box with 1-Click Copy */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ye Postback URL CPAGrip Dashboard Me Dalein:</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';
                    const url = `${origin}/api/postback/cpagrip?subid={subid}&subid2={subid2}&offer_id={offer_id}&payout={payout}&id={id}&key=${cpagripSecret || 'secret'}`;
                    navigator.clipboard.writeText(url);
                    setCopiedPostback(true);
                    setTimeout(() => setCopiedPostback(false), 2500);
                  }}
                  className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{copiedPostback ? 'Copied to Clipboard!' : 'Copy Postback URL'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-amber-300 select-all break-all">
                {typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}
                /api/postback/cpagrip?subid=&#123;subid&#125;&subid2=&#123;subid2&#125;&offer_id=&#123;offer_id&#125;&payout=&#123;payout&#125;&id=&#123;id&#125;&key={cpagripSecret || 'secret'}
              </div>
              <p className="text-[11px] text-slate-400">
                CPAGrip me <b>Postback Tools &gt; Global Postback</b> me jakar is URL ko paste kar dein. Har task conversion par CPAGrip is URL par confirmation bhejega.
              </p>
            </div>

            {/* Live 1-Click Test Postback Verification Tool */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${testingPostback ? 'animate-spin' : ''}`} />
                    <span>⚡ 1-Click Test Postback & Profit Split Simulator</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    CPAGrip ka dummy postback test karein aur dekhein ki owner profit aur user coins kaise credit hote hain.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:w-48">
                  <label className="block text-[11px] text-slate-400 mb-1">Simulated CPAGrip Payout ($ USD):</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={testPayoutAmount}
                    onChange={(e) => setTestPayoutAmount(parseFloat(e.target.value) || 1.0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendTestPostback}
                  disabled={testingPostback}
                  className="w-full sm:w-auto mt-auto px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testingPostback ? 'Sending Test...' : 'Send Test CPAGrip Postback'}</span>
                </button>
              </div>

              {testPostbackResult && (
                <div className={`p-3 rounded-xl border text-xs animate-in fade-in ${
                  testPostbackResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/40 text-red-300'
                }`}>
                  {testPostbackResult.success ? (
                    <div className="space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Postback Verified Successfully!</span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        CPAGrip Payout: <b>${testPostbackResult.payoutUsd} USD</b> • User Credited: <b>+{testPostbackResult.rewardCoins} Coins</b> • <b>Your Net Owner Profit: +${testPostbackResult.ownerProfit} USD</b>
                      </div>
                    </div>
                  ) : (
                    <div>{testPostbackResult.error}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. POSTGRESQL DATABASE & VERCEL TAB */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Persistent PostgreSQL Database Manager</h3>
                  <p className="text-xs text-slate-400">
                    Production persistent storage for Users, Wallets, Transactions, Offers, Withdrawals & Conversions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunDbMigration}
                  disabled={dbMigrating}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dbMigrating ? 'animate-spin' : ''}`} />
                  <span>{dbMigrating ? 'Verifying Tables...' : 'Verify / Run DB Migration'}</span>
                </button>
              </div>
            </div>

            {/* Connection Status Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Engine Status</span>
                <div className="flex items-center gap-2 pt-0.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  <span className={`text-sm font-bold ${dbStatus?.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {dbStatus?.connected ? 'PostgreSQL Connected' : 'Local File Fallback'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  {dbStatus?.connected ? 'Live PostgreSQL Pool Active' : 'DATABASE_URL not set in env (local JSON active)'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Target Database</span>
                <div className="text-sm font-bold text-white truncate font-mono">
                  {dbStatus?.database || 'adearn_db'}
                </div>
                <p className="text-[10px] text-slate-500 font-mono truncate">
                  Host: {dbStatus?.host || 'localhost'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Public Tables Count</span>
                <div className="text-sm font-black text-amber-400 font-mono">
                  {dbStatus?.tablesCount ?? 12} Relational Tables
                </div>
                <p className="text-[10px] text-slate-500">
                  users, wallets, transactions, offers, etc.
                </p>
              </div>
            </div>

            {dbMigrateResult && (
              <div className={`p-4 rounded-2xl text-xs border ${
                dbMigrateResult.startsWith('Error')
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                {dbMigrateResult}
              </div>
            )}

            {/* Vercel + Neon/Supabase Setup Guide */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 text-xs">
              <div className="font-bold text-indigo-300 flex items-center gap-1.5 text-sm">
                <span>🚀 How to Connect Free PostgreSQL on Vercel (1-Minute Guide):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed text-[11px]">
                <li>Create a free PostgreSQL database on <a href="https://neon.tech" target="_blank" rel="noreferrer" className="text-amber-400 underline">Neon.tech</a> or <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">Supabase.com</a>.</li>
                <li>Copy the connection string (e.g. <code>postgres://user:password@ep-cold-123.neon.tech/neondb?sslmode=require</code>).</li>
                <li>Go to your <b>Vercel Project &gt; Settings &gt; Environment Variables</b>.</li>
                <li>Add variable: <b>DATABASE_URL</b> and paste your PostgreSQL connection string.</li>
                <li>Redeploy on Vercel — all database tables will be automatically created and maintained!</li>
              </ol>
            </div>

            {/* Schema Reference */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Universal PostgreSQL Schema (`schema.sql`):</span>
                <span className="text-[10px] text-slate-400 font-mono">12 Production Tables Ready</span>
              </div>
              <p className="text-[11px] text-slate-400">
                The schema file has been created at <code>/schema.sql</code>. You can paste it directly into your Supabase SQL editor or Neon Console.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 9. ADMIN SECURITY & PASSWORD TAB */}
      {activeTab === 'security' && (
        <div className="max-w-xl mx-auto p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Change Master Admin Password</h3>
              <p className="text-xs text-slate-400">
                Protect your platform earnings. Update your admin security key here.
              </p>
            </div>
          </div>

          {adminPasswordSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{adminPasswordSuccess}</span>
            </div>
          )}

          {adminPasswordError && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold">
              {adminPasswordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Signed-in Admin</label>
              <input
                type="text"
                disabled
                value={admin.email}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">New Admin Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={adminNewPassword}
                onChange={(e) => setAdminNewPassword(e.target.value)}
                placeholder="Enter strong new password (min 6 characters)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={adminConfirmPassword}
                onChange={(e) => setAdminConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 text-xs"
            >
              {changingPassword ? 'Updating Password...' : 'Save New Admin Password'}
            </button>
          </form>
        </div>
      )}

      {/* WITHDRAWAL APPROVE/REJECT MODAL */}
      {payoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {payoutModal.mode === 'approve' ? 'Confirm Payout Approval' : 'Reject & Reverse Payout'}
            </h3>
            <p className="text-xs text-slate-300">
              Amount: <b className="text-emerald-400">${payoutModal.amountFiat} USD</b> via {payoutModal.method}
            </p>

            {payoutModal.mode === 'approve' ? (
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">
                  Bank / UPI / PayPal Transaction Reference ID
                </label>
                <input
                  type="text"
                  value={txRefInput}
                  onChange={(e) => setTxRefInput(e.target.value)}
                  placeholder="e.g. UTR-9876543210 or PAYPAL-TXN-8877"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            ) : (
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">
                  Reason for Rejection (Visible to user)
                </label>
                <input
                  type="text"
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder="e.g. Invalid UPI ID provided or suspicious offer completion"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <p className="text-[11px] text-amber-400 mt-1">
                  Coins will be automatically credited back to user wallet!
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleProcessWithdrawal}
                className={`flex-1 py-2 rounded-xl text-xs font-bold text-slate-950 cursor-pointer ${
                  payoutModal.mode === 'approve' ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-red-400 hover:bg-red-300'
                }`}
              >
                {payoutModal.mode === 'approve' ? 'Confirm & Mark Paid' : 'Confirm & Refund Coins'}
              </button>
              <button
                onClick={() => setPayoutModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT OFFER MODAL */}
      {showAddOfferModal && editingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white">
              {editingOffer.id ? 'Edit Offer' : 'Create New Offer'}
            </h3>

            <form onSubmit={handleSaveOffer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Offer Title</label>
                <input
                  type="text"
                  required
                  value={editingOffer.title || ''}
                  onChange={(e) => setEditingOffer({ ...editingOffer, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={editingOffer.description || ''}
                  onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={editingOffer.category || 'VIDEO_AD'}
                    onChange={(e) => setEditingOffer({ ...editingOffer, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="VIDEO_AD">Video Ad</option>
                    <option value="APP_INSTALL">App Install</option>
                    <option value="SURVEY">Survey</option>
                    <option value="SIGNUP">Free Signup</option>
                    <option value="CPA_OFFER">CPA Quiz</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Reward Coins</label>
                  <input
                    type="number"
                    required
                    value={editingOffer.reward_coins || 100}
                    onChange={(e) => setEditingOffer({ ...editingOffer, reward_coins: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Est. Duration (Min/Sec)</label>
                  <input
                    type="number"
                    value={editingOffer.estimated_minutes || 1}
                    onChange={(e) => setEditingOffer({ ...editingOffer, estimated_minutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Countries</label>
                  <input
                    type="text"
                    value={editingOffer.target_countries || 'ALL'}
                    onChange={(e) => setEditingOffer({ ...editingOffer, target_countries: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Custom CPAGrip Offer URL (Optional - Leave blank to use default India Locker):
                </label>
                <input
                  type="text"
                  value={editingOffer.tracking_url_template || ''}
                  onChange={(e) => setEditingOffer({ ...editingOffer, tracking_url_template: e.target.value })}
                  placeholder="e.g. https://www.cpagrip.com/show.php?l=0&u=2559473&id=XXXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Requirements</label>
                <input
                  type="text"
                  value={editingOffer.requirements || ''}
                  onChange={(e) => setEditingOffer({ ...editingOffer, requirements: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={editingOffer.active ?? true}
                  onChange={(e) => setEditingOffer({ ...editingOffer, active: e.target.checked })}
                  className="rounded text-amber-500"
                />
                <label htmlFor="activeCheck" className="text-slate-300">
                  Active (Visible to users)
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Offer
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddOfferModal(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
