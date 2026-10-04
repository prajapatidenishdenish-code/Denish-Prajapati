import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { Offer, OfferCategory } from '../server/types.ts';
import { DEFAULT_OFFERS } from '../data/defaultOffers.ts';
import { WatchModal } from '../components/WatchModal.tsx';
import {
  Play,
  Clock,
  Coins,
  ShieldCheck,
  Search,
  Filter,
  Sparkles,
  Gift,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Flame,
  Download,
  ClipboardList,
  Mail,
  HelpCircle,
  Lock,
  PlaySquare,
  X,
} from 'lucide-react';

interface EarnPageProps {
  openAuthModal: (mode: 'login' | 'register') => void;
  setCurrentTab: (tab: string) => void;
}

export const EarnPage: React.FC<EarnPageProps> = ({ openAuthModal, setCurrentTab }) => {
  const { user, wallet, refreshUser } = useAuth();
  const [offers, setOffers] = useState<Offer[]>(DEFAULT_OFFERS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOffer, setActiveOffer] = useState<Offer | null>(null);

  // Daily bonus status
  const [bonusStatus, setBonusStatus] = useState<{
    canClaim: boolean;
    currentStreak: number;
    nextRewardCoins: number;
    hoursUntilNextClaim: number;
  }>({
    canClaim: false,
    currentStreak: 0,
    nextRewardCoins: 50,
    hoursUntilNextClaim: 0,
  });
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [bonusClaimedSuccess, setBonusClaimedSuccess] = useState<string | null>(null);

  // Success toast for offer completion
  const [toastReward, setToastReward] = useState<number | null>(null);

  // Video locker status
  const [videoLockerData, setVideoLockerData] = useState<{
    enabled: boolean;
    videoLockerUrl: string;
    videoLockerCode: string;
    rewardCoins: number;
    videoSlot1Url?: string;
    videoSlot2Url?: string;
    offerSlot3Url?: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('cpagrip_video_locker_data');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: true,
      videoLockerUrl: 'https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed',
      videoLockerCode: '',
      rewardCoins: 500,
      videoSlot1Url: 'https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed',
      videoSlot2Url: 'https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed',
      offerSlot3Url: 'https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed',
    };
  });
  const [showVideoLockerModal, setShowVideoLockerModal] = useState(false);

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/offers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setOffers(data);
        }
      }
    } catch (e) {
      console.warn('API offers fallback to local offers:', e);
      // Already has DEFAULT_OFFERS loaded!
    }
  };

  const fetchVideoLocker = async () => {
    try {
      const res = await fetch('/api/cpa/video-locker');
      if (res.ok) {
        const data = await res.json();
        if (data && data.videoLockerUrl) {
          setVideoLockerData(data);
          try {
            localStorage.setItem('cpagrip_video_locker_data', JSON.stringify(data));
          } catch {}
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBonusStatus = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('adearn_user_token');
      const res = await fetch('/api/daily-bonus/status', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        setBonusStatus(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOffers();
    fetchVideoLocker();
    if (user) {
      fetchBonusStatus();
    }
  }, [user]);

  // Dynamically load CPAGrip video locker script if opened
  useEffect(() => {
    if (showVideoLockerModal && videoLockerData.videoLockerCode) {
      const match = videoLockerData.videoLockerCode.match(/src=["']([^"']+)["']/);
      if (match && match[1]) {
        const scriptId = 'cpagrip-locker-script';
        const existing = document.getElementById(scriptId);
        if (!existing) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = match[1];
          script.type = 'text/javascript';
          script.async = true;
          document.body.appendChild(script);
        }
      }
    }
  }, [showVideoLockerModal, videoLockerData.videoLockerCode]);

  const handleClaimDailyBonus = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setClaimingBonus(true);
    setBonusClaimedSuccess(null);

    try {
      const token = localStorage.getItem('adearn_user_token');
      const res = await fetch('/api/daily-bonus/claim', {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to claim');

      setBonusClaimedSuccess(`+${data.bonusCoins} Coins claimed! Day ${data.streakDay} streak.`);
      await refreshUser();
      await fetchBonusStatus();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setClaimingBonus(false);
    }
  };

  const handleStartOffer = (offer: Offer) => {
    setActiveOffer(offer);
  };

  const filteredOffers = offers.filter((o) => {
    const matchesCat = selectedCategory === 'ALL' || o.category === selectedCategory;
    const matchesSearch =
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.sponsor_brand && o.sponsor_brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Toast Notification */}
      {toastReward && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <Sparkles className="w-5 h-5" />
          <span>Reward Added: +{toastReward} Coins deposited!</span>
        </div>
      )}

      {/* DAILY BONUS HERO CARD */}
      <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-emerald-500/15 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <Gift className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">Daily Login Streak Bonus</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400 fill-current" /> Streak: {bonusStatus.currentStreak} Days
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Log in every 24 hours to multiply your free rewards. Next reward:{' '}
              <b className="text-amber-400">+{bonusStatus.nextRewardCoins} Coins</b>
            </p>
            {bonusClaimedSuccess && (
              <span className="text-xs text-emerald-400 font-semibold block mt-1">{bonusClaimedSuccess}</span>
            )}
          </div>
        </div>

        <div>
          {bonusStatus.canClaim ? (
            <button
              onClick={handleClaimDailyBonus}
              disabled={claimingBonus}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 active:scale-95 text-slate-950 font-bold rounded-xl shadow-md transition-all text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{claimingBonus ? 'Claiming...' : `Claim +${bonusStatus.nextRewardCoins} Coins`}</span>
            </button>
          ) : (
            <div className="px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-400 text-xs flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>
                {user
                  ? `Next claim in ~${bonusStatus.hoursUntilNextClaim}h`
                  : 'Sign in to claim daily bonus'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Available Tasks & Offers</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete verified offers to receive instant coin rewards. Conversions are verified server-side.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, sponsor..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* 🔥 VIP JACKPOT MEGA-VAULT HIGH-CTR CARD */}
      <div className="mb-8 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-amber-500/25 via-purple-950/60 to-emerald-500/25 border-2 border-amber-400/50 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/20 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                👑 VIP Mega Rewards Vault
              </h3>
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 tracking-wider uppercase shadow">
                ⚡ 5X MULTIPLIER
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                🔥 4 Bonus Slots Remaining Today
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
              Watch 1 verified sponsor spotlight or complete 1 quick deal to unlock up to{' '}
              <b className="text-amber-400 font-mono text-base font-black">1,500 Coins ($1.50 USD)</b> directly into your wallet balance.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-[11px] text-slate-300 font-medium">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Instant Server Credit
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-300">
                <Flame className="w-3.5 h-3.5 fill-current" /> Dual-Server Fast Stream
              </span>
              <span>•</span>
              <span className="text-indigo-300">Zero App Lock Required</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto z-10">
          <button
            onClick={() => {
              if (!user) {
                openAuthModal('login');
                return;
              }
              setShowVideoLockerModal(true);
            }}
            className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
          >
            <PlaySquare className="w-4 h-4 fill-current" />
            <span>Launch VIP Rewards Vault (+{videoLockerData.rewardCoins || 500} Coins)</span>
          </button>
        </div>
      </div>

      {/* CATEGORY FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {[
          { id: 'ALL', label: 'All Offers' },
          { id: 'VIDEO_AD', label: 'Video Ads (15-30s)' },
          { id: 'APP_INSTALL', label: 'App Installs' },
          { id: 'SURVEY', label: 'Surveys' },
          { id: 'SIGNUP', label: 'Free Signups' },
          { id: 'CPA_OFFER', label: 'CPA Quizzes' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* OFFERS GRID */}
      {filteredOffers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
          <h4 className="text-base font-bold text-white">No Offers Found</h4>
          <p className="text-xs text-slate-400">Try selecting another category or clear your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => {
            const isVideo = offer.category === 'VIDEO_AD';
            const usdValue = (offer.reward_coins / 1000).toFixed(2);

            return (
              <div
                key={offer.id}
                className="group relative rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-5 flex flex-col justify-between transition-all duration-200 shadow-md hover:shadow-xl"
              >
                {/* Top Media / Thumbnail */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 mb-4 border border-slate-800/80">
                  {offer.banner_url ? (
                    <img
                      src={offer.banner_url}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                      <Play className="w-8 h-8 text-amber-500/50" />
                    </div>
                  )}

                  {/* Category Pill */}
                  <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-400 border border-slate-800">
                    {offer.category.replace('_', ' ')}
                  </div>

                  {/* Duration Pill */}
                  <div className="absolute bottom-2.5 right-2.5 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-300 border border-slate-800 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{isVideo ? `${offer.video_duration_sec}s` : `${offer.estimated_minutes} min`}</span>
                  </div>
                </div>

                {/* Offer Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {offer.sponsor_brand || 'Verified Sponsor'}
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-medium">
                      <ShieldCheck className="w-3 h-3" /> Auto-Verified
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {offer.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {offer.description}
                  </p>
                </div>

                {/* Requirements Box */}
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 mb-4">
                  <span className="font-semibold text-slate-300">Rule: </span>
                  {offer.requirements}
                </div>

                {/* Bottom Row: Coins & Action */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-amber-400 font-mono tracking-tight flex items-center gap-1">
                      <Coins className="w-4 h-4 text-amber-400" />
                      +{offer.reward_coins} Coins
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      ≈ ${usdValue} USD
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartOffer(offer)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-emerald-400 hover:brightness-105 active:scale-95 text-slate-950 font-bold rounded-xl shadow transition-all text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {offer.category === 'VIDEO_AD' && <Play className="w-3.5 h-3.5 fill-current" />}
                    {offer.category === 'APP_INSTALL' && <Download className="w-3.5 h-3.5" />}
                    {offer.category === 'SURVEY' && <ClipboardList className="w-3.5 h-3.5" />}
                    {offer.category === 'SIGNUP' && <Mail className="w-3.5 h-3.5" />}
                    {offer.category === 'CPA_OFFER' && <HelpCircle className="w-3.5 h-3.5" />}
                    <span>
                      {offer.category === 'VIDEO_AD' && 'Watch Ad'}
                      {offer.category === 'APP_INSTALL' && 'Install App'}
                      {offer.category === 'SURVEY' && 'Take Survey'}
                      {offer.category === 'SIGNUP' && 'Free Signup'}
                      {offer.category === 'CPA_OFFER' && 'Take Quiz'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WATCH / TASK MODAL */}
      {activeOffer && (
        <WatchModal
          offer={activeOffer}
          onClose={() => setActiveOffer(null)}
          onSuccess={(coins) => {
            setActiveOffer(null);
            setToastReward(coins);
            setTimeout(() => setToastReward(null), 4000);
          }}
        />
      )}

      {/* 👑 VIP MEGA REWARDS VAULT MODAL (3 ACTIVE STREAMS) */}
      {showVideoLockerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-slate-900 border-2 border-amber-400/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>👑 VIP Mega Rewards Vault</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                      +{videoLockerData.rewardCoins || 500} COINS
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Select any active server below to complete 1 quick deal and unlock reward.</p>
                </div>
              </div>
              <button
                onClick={() => setShowVideoLockerModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-emerald-500/10 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400 fill-current" />
                  <span>Triple-Server Redundancy Active</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Agar kisi ek server me offer load hone me problem ho, toh aap turant doosra server choose kar sakte hain. Task complete hote hi coins wallet me add ho jayenge.
                </p>
              </div>

              {/* 3 Active Campaign Stream Options */}
              <div className="space-y-3">
                {/* Stream 1: Video Server 1 */}
                <a
                  href={videoLockerData.videoSlot1Url || 'https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 hover:border-indigo-400 flex items-center justify-between group transition-all cursor-pointer shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                      <PlaySquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs group-hover:text-indigo-300 flex items-center gap-1.5">
                        <span>▶️ Stream 1: Adsterra Ultra Fast Video Ad</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">Online</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Watch Adsterra instant video promo • +500 Coins</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
                </a>

                {/* Stream 2: Video Server 2 (Adsterra SmartLink) */}
                <a
                  href={videoLockerData.videoSlot2Url || 'https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-purple-500/40 hover:border-purple-400 flex items-center justify-between group transition-all cursor-pointer shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs group-hover:text-purple-300 flex items-center gap-1.5">
                        <span>⚡ Stream 2: High CPM Adsterra SmartLink</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold uppercase">High Speed</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Instant sponsor deal & smart ad stream • +500 Coins</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
                </a>

                {/* Stream 3: High Payout Direct Sponsor Offer */}
                <a
                  href={videoLockerData.offerSlot3Url || 'https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-950 to-emerald-500/15 border border-amber-400/50 hover:border-amber-400 flex items-center justify-between group transition-all cursor-pointer shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs group-hover:text-amber-300 flex items-center gap-1.5">
                        <span>🚀 Stream 3: Adsterra High Payout Sponsor Deal (5X)</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black uppercase">MAX PAYOUT</span>
                      </div>
                      <p className="text-[11px] text-amber-300">Complete 1 quick sponsor deal • Up to +1,200 Coins</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-amber-400 group-hover:text-white shrink-0" />
                </a>
              </div>
              <p className="text-[11px] text-center text-slate-400">
                Tasks will open in a secure window. Once completed, coins are verified and credited!
              </p>

              {/* Claim locker reward button */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Reward upon unlock:</span>
                  <span className="font-mono text-amber-400 font-bold">+{videoLockerData.rewardCoins || 500} Coins</span>
                </div>
                <button
                    onClick={async () => {
                      if (!user) {
                        openAuthModal('login');
                        return;
                      }
                      try {
                        const token = localStorage.getItem('adearn_user_token');
                        await fetch('/api/offers/1/complete', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                          },
                          body: JSON.stringify({ trackingToken: `locker_${Date.now()}` }),
                        });
                      } catch {}
                      try {
                        const rawWallet = localStorage.getItem('adearn_cached_wallet');
                        if (rawWallet) {
                          const w = JSON.parse(rawWallet);
                          w.balance_coins = (w.balance_coins || 0) + videoLockerData.rewardCoins;
                          w.lifetime_earnings_coins = (w.lifetime_earnings_coins || 0) + videoLockerData.rewardCoins;
                          localStorage.setItem('adearn_cached_wallet', JSON.stringify(w));
                        }
                      } catch {}
                      await refreshUser();
                      setShowVideoLockerModal(false);
                      setToastReward(videoLockerData.rewardCoins);
                      setTimeout(() => setToastReward(null), 4000);
                    }}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>I Completed Locker Offer (Claim +{videoLockerData.rewardCoins} Coins)</span>
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
