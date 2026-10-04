import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { Offer } from '../server/types.ts';
import { WatchModal } from '../components/WatchModal.tsx';
import {
  Play,
  Coins,
  ShieldCheck,
  Zap,
  ArrowRight,
  Gift,
  Users,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  Sparkles,
  ExternalLink,
  Flame,
} from 'lucide-react';

interface HomePageProps {
  setCurrentTab: (tab: string) => void;
  openAuthModal: (mode: 'login' | 'register') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentTab, openAuthModal }) => {
  const { user, wallet, refreshUser } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activeOffer, setActiveOffer] = useState<Offer | null>(null);
  const [successToast, setSuccessToast] = useState<number | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 18450,
    totalPaidUsd: 64890.5,
    totalTasksCompleted: 82400,
    activeOffersCount: 8,
  });

  useEffect(() => {
    fetch('/api/public/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});

    fetch('/api/offers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setOffers(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. HERO SECTION */}
      <section className="relative w-full overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-amber-400 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Legitimate Rewards Platform • 100% Verified Payouts</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight max-w-4xl">
          Watch, Complete &{' '}
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
            Earn Rewards
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
          Turn your spare time into real money. Watch genuine sponsor video ads, complete high-paying CPA offers, and
          cash out instantly via <span className="text-white font-semibold">UPI, PayPal, and Bank Transfer</span>.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {user ? (
            <button
              onClick={() => setCurrentTab('earn')}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-400 to-emerald-400 hover:brightness-105 active:scale-98 text-slate-950 font-bold rounded-2xl shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2.5 transition-all text-sm cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Go to Available Tasks</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => openAuthModal('register')}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 hover:brightness-105 active:scale-98 text-slate-950 font-bold rounded-2xl shadow-xl shadow-amber-500/15 flex items-center justify-center gap-2.5 transition-all text-sm cursor-pointer"
              >
                <Gift className="w-4 h-4" />
                <span>Claim 100 Free Coins & Register</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => openAuthModal('login')}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl border border-slate-700/80 transition-all text-sm cursor-pointer"
              >
                Sign In to Account
              </button>
            </>
          )}
        </div>

        {/* Quick Highlights / Trust Row */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Instant Postback Tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Min. Withdrawal $5.00</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero Withdrawal Fees</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Anti-Fraud Protected</span>
          </div>
        </div>
      </section>

      {/* 1.5 LIVE TASKS SHOWCASE DIRECTLY ON HOME PAGE */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Flame className="w-3.5 h-3.5 fill-current" /> Live Tasks Available Right Now
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Click Any Task Below to Watch & Earn Instantly
              </h2>
            </div>
            <button
              onClick={() => setCurrentTab('earn')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 self-start sm:self-auto cursor-pointer border border-amber-500/30 shadow"
            >
              <span>View All 24 Active Offers</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {offers.slice(0, 4).map((offer) => (
              <div
                key={offer.id}
                onClick={() => setActiveOffer(offer)}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 relative">
                    <img
                      src={offer.banner_url || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&auto=format&fit=crop&q=80'}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] font-bold text-amber-400">
                      {offer.category.replace('_', ' ')}
                    </div>
                  </div>
                  <h4 className="font-bold text-white text-xs line-clamp-1 group-hover:text-amber-300">
                    {offer.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {offer.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs font-black text-amber-400 font-mono flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" /> +{offer.reward_coins} Coins
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-400 text-slate-950 flex items-center gap-1">
                    <Play className="w-3 h-3 fill-current" /> Start
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. LIVE STATISTICS COUNTER */}
      <section className="w-full bg-slate-900/60 border-y border-slate-800/80 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              ${stats.totalPaidUsd.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">Paid to Users</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {stats.totalUsers.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">Registered Earners</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
            <div className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">
              {stats.totalTasksCompleted.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">Verified Conversions</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
              100%
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">Payout Completion Rate</div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Simple & Transparent</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
            How AdEarn Pro Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Our platform operates on a verified CPA model: Advertisers pay us for genuine engagement, and we share the
            revenue directly with you in coins.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-lg flex items-center justify-center mb-5">
              01
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Choose an Ad or CPA Task</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Browse high-paying 15-30s video ads, interactive brand quizzes, mobile app trials, or consumer surveys
                tailored to your device.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/60 text-[11px] text-amber-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Average duration: 1 to 3 minutes
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-lg flex items-center justify-center mb-5">
              02
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Server-Side Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Watch the video to completion without skips. When eligible, the advertising provider triggers an encrypted
                postback signal directly to our backend server.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/60 text-[11px] text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Guaranteed zero fraudulent claims
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-black text-lg flex items-center justify-center mb-5">
              03
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Instant Credit & Cashout</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Coins land immediately into your wallet ledger. When you reach 5,000 coins ($5.00), submit a withdrawal
                request to UPI, PayPal or direct Bank Transfer!
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/60 text-[11px] text-indigo-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Payouts processed within 24-48 hours
            </div>
          </div>
        </div>
      </section>

      {/* 4. EARNING METHODS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Multi-Channel Earning</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
            Available Earning Streams
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Diverse earning formats suitable for desktop, mobile and tablet.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <h4 className="font-bold text-sm text-white">HD Video Ads</h4>
            <p className="text-xs text-slate-400 mt-1">Watch 15-30 second sponsor commercials and earn 90-150 coins per clip.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">App & Game Trials</h4>
            <p className="text-xs text-slate-400 mt-1">Test out trending new apps and games for top-tier rewards up to 1,500 coins.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
              <Gift className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">Daily Login Streaks</h4>
            <p className="text-xs text-slate-400 mt-1">Claim free coins every 24 hours. Consecutive daily streaks earn up to 200+ coins!</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">10% Referral Program</h4>
            <p className="text-xs text-slate-400 mt-1">Invite friends and earn a lifetime 10% commission on every offer they finish.</p>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section className="my-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="relative rounded-3xl bg-gradient-to-r from-amber-600/30 via-slate-900 to-emerald-600/30 border border-slate-800 p-8 sm:p-12 text-center overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Ready to Start Earning Today?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Join thousands of members already earning daily rewards. Register in under 30 seconds and receive 100 free
              starter coins!
            </p>
            <div className="pt-2">
              <button
                onClick={() => (user ? setCurrentTab('earn') : openAuthModal('register'))}
                className="px-8 py-3.5 bg-gradient-to-r from-amber-400 to-emerald-400 hover:brightness-105 active:scale-98 text-slate-950 font-bold rounded-2xl shadow-xl transition-all text-sm cursor-pointer"
              >
                {user ? 'Browse Available Offers' : 'Create Free Account & Claim 100 Coins'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Direct In-App Video & Offer Modal */}
      {activeOffer && (
        <WatchModal
          offer={activeOffer}
          onClose={() => setActiveOffer(null)}
          onSuccess={(coins) => {
            setActiveOffer(null);
            setSuccessToast(coins);
            if (refreshUser) refreshUser();
          }}
        />
      )}

      {/* Floating Success Toast */}
      {successToast !== null && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-500 text-slate-950 font-bold rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <div>
            <div className="text-sm font-black">+{successToast} Coins Deposited!</div>
            <div className="text-[11px] font-medium opacity-90">Added directly into your wallet.</div>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="ml-2 text-slate-950/70 hover:text-slate-950 cursor-pointer font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
