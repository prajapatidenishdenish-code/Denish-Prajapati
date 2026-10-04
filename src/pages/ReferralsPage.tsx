import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { Referral } from '../server/types.ts';
import { Users, Copy, Check, Gift, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

interface ReferralsPageProps {
  openAuthModal: (mode: 'login' | 'register') => void;
}

export const ReferralsPage: React.FC<ReferralsPageProps> = ({ openAuthModal }) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<{
    referrals: Referral[];
    totalReferrals: number;
    activeReferrals: number;
    totalEarnedCoins: number;
    referralCode: string;
    commissionPercent: number;
    signupBonus: number;
  }>({
    referrals: [],
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnedCoins: 0,
    referralCode: '',
    commissionPercent: 10,
    signupBonus: 100,
  });

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('adearn_user_token');
    fetch('/api/referrals', {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json) setData(json);
      })
      .catch((e) => console.error(e));
  }, [user]);

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${data.referralCode || user?.referral_code || ''}`
    : `https://adearnpro.com/?ref=${user?.referral_code || ''}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <Users className="w-16 h-16 text-amber-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Join the Referral Program</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Sign in to get your exclusive referral link and earn 10% commission on every offer completed by your friends.
        </p>
        <button
          onClick={() => openAuthModal('register')}
          className="px-6 py-3 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-bold rounded-xl text-sm"
        >
          Create Free Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-emerald-500/15 border border-slate-800 p-6 sm:p-10 shadow-xl overflow-hidden">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold">
            <Gift className="w-3.5 h-3.5" />
            <span>Lifetime Referral Commission: {data.commissionPercent}%</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Invite Friends & Earn Together
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Share your custom invite link. When a friend joins, they get{' '}
            <b className="text-amber-400">+{data.signupBonus} free starter coins</b>, and you automatically earn{' '}
            <b className="text-emerald-400">{data.commissionPercent}% of all coins</b> they earn from completed watch tasks
            forever!
          </p>
        </div>

        {/* Link Share Box */}
        <div className="mt-6 max-w-xl">
          <label className="block text-slate-400 text-xs font-semibold mb-2">Your Unique Referral Invite Link</label>
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2 pl-4">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="bg-transparent text-white font-mono text-xs focus:outline-none flex-1 truncate"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Your Referral Code: <span className="font-mono text-amber-400 font-bold">{data.referralCode || user.referral_code}</span>
          </p>
        </div>
      </div>

      {/* Referral Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-slate-400 text-xs font-semibold mb-1">Total Friends Joined</div>
          <div className="text-3xl font-black text-white font-mono">{data.totalReferrals}</div>
          <div className="text-xs text-slate-500 mt-1">From your direct invite link</div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-slate-400 text-xs font-semibold mb-1">Active Earners</div>
          <div className="text-3xl font-black text-emerald-400 font-mono">{data.activeReferrals}</div>
          <div className="text-xs text-slate-500 mt-1">Actively watching & completing</div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-slate-400 text-xs font-semibold mb-1">Commission Earned</div>
          <div className="text-3xl font-black text-amber-400 font-mono">{data.totalEarnedCoins.toLocaleString()} Coins</div>
          <div className="text-xs text-slate-500 mt-1">≈ ${(data.totalEarnedCoins / 1000).toFixed(2)} USD value</div>
        </div>
      </div>

      {/* Referrals List */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Your Invited Friends</h3>
        {data.referrals.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            You haven't referred any friends yet. Copy your link above and share it on WhatsApp, Telegram, or Twitter!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">User ID</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Commission Received</th>
                  <th className="pb-3 font-semibold">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {data.referrals.map((ref) => (
                  <tr key={ref.id} className="text-slate-300">
                    <td className="py-3 font-mono">User #{ref.referee_user_id}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-amber-400">+{ref.bonus_awarded_coins} Coins</td>
                    <td className="py-3 text-slate-500 text-[11px]">
                      {new Date(ref.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
