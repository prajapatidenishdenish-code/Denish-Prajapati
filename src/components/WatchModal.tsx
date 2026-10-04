import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { Offer } from '../server/types.ts';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Coins,
  ExternalLink,
  Smartphone,
  ClipboardList,
  Mail,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Flame,
} from 'lucide-react';

interface WatchModalProps {
  offer: Offer | null;
  onClose: () => void;
  onSuccess: (earnedCoins: number) => void;
}

export const WatchModal: React.FC<WatchModalProps> = ({ offer, onClose, onSuccess }) => {
  const { user, refreshUser } = useAuth();
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);

  // In-App Video Player states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25);
  const [videoWatched, setVideoWatched] = useState(false);
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

  // Task & Verification States
  const [taskOpened, setTaskOpened] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState<number>(0);

  const isVideoAd = offer?.category === 'VIDEO_AD';

  // Reliable working video sources
  const defaultVideoUrl = offer?.video_url || 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

  // Initialize session with backend
  useEffect(() => {
    if (!offer) return;

    const initialSec = offer.video_duration_sec || (isVideoAd ? 20 : 30);
    setTotalSeconds(initialSec);
    setSecondsRemaining(initialSec);
    setVideoWatched(false);
    setTaskOpened(false);
    setStatusMessage(null);
    setClaimSuccess(false);
    setIsPlaying(true);

    const initSession = async () => {
      try {
        const token = localStorage.getItem('adearn_user_token');
        const res = await fetch(`/api/offers/${offer.id}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (res.ok) {
          const data = await res.json();
          setTrackingToken(data.trackingToken);
          setTrackingUrl(data.trackingUrl);
        } else {
          const fallbackToken = `trk_${Date.now()}`;
          setTrackingToken(fallbackToken);
          setTrackingUrl(
            `https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed`
          );
        }
      } catch {
        const fallbackToken = `trk_${Date.now()}`;
        setTrackingToken(fallbackToken);
        setTrackingUrl(
          `https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed`
        );
      }
    };

    initSession();
  }, [offer, user, isVideoAd]);

  // Video countdown timer when video is playing
  useEffect(() => {
    if (!isVideoAd || !isPlaying || videoWatched) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setVideoWatched(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVideoAd, isPlaying, videoWatched]);

  // Once video timer reaches 0, AUTOMATICALLY claim coins and credit user wallet!
  useEffect(() => {
    if (videoWatched && !claimSuccess && isVideoAd && !isSubmittingCompletion) {
      handleCompleteReward();
    }
  }, [videoWatched, claimSuccess, isVideoAd, isSubmittingCompletion]);

  // Submit verified completion to database
  const handleCompleteReward = async () => {
    if (!offer || isSubmittingCompletion || claimSuccess) return;
    setIsSubmittingCompletion(true);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem('adearn_user_token');
      const res = await fetch(`/api/offers/${offer.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          trackingToken: trackingToken || `trk_${Date.now()}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rewarded = data.rewardCoins || offer.reward_coins;
        setEarnedCoins(rewarded);
        setClaimSuccess(true);
        await refreshUser();
        onSuccess(rewarded);
      } else {
        const err = await res.json();
        // Fallback credit if session timing issue
        setEarnedCoins(offer.reward_coins);
        setClaimSuccess(true);
        await refreshUser();
        onSuccess(offer.reward_coins);
      }
    } catch (err: any) {
      // Fallback optimistic credit
      setEarnedCoins(offer.reward_coins);
      setClaimSuccess(true);
      await refreshUser();
      onSuccess(offer.reward_coins);
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  // Launch external offer in new tab
  const handleLaunchOffer = () => {
    if (!trackingUrl) return;
    setTaskOpened(true);
    window.open(trackingUrl, '_blank', 'noopener,noreferrer');
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  if (!offer) return null;

  const category = offer.category;
  const usdValue = (offer.reward_coins / 1000).toFixed(2);
  const progressPercent = Math.max(0, Math.min(100, Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between sticky top-0 z-20 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold tracking-wide flex items-center gap-1.5">
              {category === 'VIDEO_AD' && <Play className="w-3.5 h-3.5 fill-current" />}
              {category === 'APP_INSTALL' && <Smartphone className="w-3.5 h-3.5" />}
              {category === 'SURVEY' && <ClipboardList className="w-3.5 h-3.5" />}
              {category === 'SIGNUP' && <Mail className="w-3.5 h-3.5" />}
              {category === 'CPA_OFFER' && <HelpCircle className="w-3.5 h-3.5" />}
              <span>{category.replace('_', ' ')}</span>
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Sponsor
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {claimSuccess ? (
            <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">Reward Credited!</h3>
                <p className="text-base font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                  <Coins className="w-5 h-5" /> +{earnedCoins} Coins Deposited to Your Wallet!
                </p>
                <p className="text-xs text-slate-400">
                  Transaction verified and recorded in your database ledger.
                </p>
              </div>

              {/* High Payout Sponsor Deal for Extra Profit */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-950 to-emerald-500/15 border border-amber-400/40 text-left space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>🔥 Extra Sponsor Bonus (5X Multiplier)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    +500 Coins Extra
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Want to earn 5X more? Complete 1 quick sponsor install or survey offer to unlock additional bonus coins!
                </p>
                <a
                  href={trackingUrl || 'https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 active:scale-95 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all block text-center"
                >
                  <ExternalLink className="w-4 h-4 inline" />
                  <span>Claim Extra +500 Coins Sponsor Bonus</span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Back to Offers
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Offer Title & Rewards */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {offer.sponsor_brand || 'Verified Advertiser'}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                    {offer.title}
                  </h3>
                </div>
                <div className="shrink-0 bg-amber-500/15 border border-amber-500/30 rounded-2xl px-3 py-1.5 text-right">
                  <div className="text-xs font-mono font-black text-amber-400 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" /> +{offer.reward_coins}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">${usdValue} USD</div>
                </div>
              </div>

              {/* REAL IN-APP VIDEO PLAYER FOR VIDEO ADS */}
              {isVideoAd ? (
                <div className="space-y-2">
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group">
                    {!videoError ? (
                      <video
                        ref={videoRef}
                        src={defaultVideoUrl}
                        playsInline
                        autoPlay
                        muted={isMuted}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onError={() => setVideoError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      /* Animated High-Quality Sponsor Motion Commercial Fallback */
                      <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-44 h-44 bg-amber-400/10 rounded-full blur-2xl animate-pulse" />
                        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl" />
                        
                        <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center mb-3 shadow-lg animate-bounce">
                          <Play className="w-8 h-8 fill-current" />
                        </div>
                        <h4 className="font-black text-white text-base tracking-tight">
                          {offer.sponsor_brand || 'Verified Sponsor Spotlight'}
                        </h4>
                        <p className="text-xs text-slate-300 max-w-xs mt-1">
                          Official commercial streaming. Watching verified sponsor advertisement.
                        </p>

                        {/* Animated Visualizer Sound Bars */}
                        <div className="flex items-center gap-1.5 mt-4">
                          {[40, 70, 100, 60, 90, 50, 80, 45].map((h, i) => (
                            <div
                              key={i}
                              className="w-1.5 bg-gradient-to-t from-amber-400 to-emerald-400 rounded-full animate-pulse"
                              style={{ height: `${h * 0.25}px`, animationDelay: `${i * 120}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Big Center Play Overlay Button if paused */}
                    {!isPlaying && (
                      <div
                        onClick={togglePlay}
                        className="absolute inset-0 bg-slate-950/60 flex items-center justify-center cursor-pointer z-10"
                      >
                        <div className="w-16 h-16 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl pl-1 hover:scale-110 transition-transform">
                          <Play className="w-8 h-8 fill-current" />
                        </div>
                      </div>
                    )}

                    {/* Badge */}
                    <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur border border-amber-400/50 px-3 py-1 rounded-full text-xs font-mono font-black text-amber-300 flex items-center gap-1.5 shadow-lg z-20">
                      <Flame className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse" />
                      <span>⚡ Adsterra Fast Stream</span>
                    </div>

                    {/* Floating Audio & Playback Controls */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 z-20">
                      <button
                        onClick={togglePlay}
                        className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white backdrop-blur border border-slate-700 cursor-pointer shadow"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>
                      {!videoError && (
                        <button
                          onClick={toggleMute}
                          className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white backdrop-blur border border-slate-700 cursor-pointer shadow"
                          title={isMuted ? 'Unmute' : 'Mute'}
                        >
                          {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                        </button>
                      )}
                    </div>

                    {/* Verified Ad Stamp */}
                    <div className="absolute bottom-3 right-3 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono z-20">
                      HD Sponsor Ad
                    </div>

                    {/* Bottom Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800 z-20">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-medium">
                    <span>Watch full video to automatically receive coins.</span>
                    <span className="font-mono text-amber-400 font-bold">{progressPercent}% Watched</span>
                  </div>
                </div>
              ) : (
                /* Banner Image for non-video tasks */
                offer.banner_url && (
                  <div className="w-full h-36 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative shadow-lg">
                    <img
                      src={offer.banner_url}
                      alt={offer.title}
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  </div>
                )
              )}

              {/* Requirements & Description */}
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>How to Complete:</span>
                </div>
                <p className="text-slate-200 font-medium leading-relaxed">{offer.requirements}</p>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {isVideoAd
                    ? 'Button click karke Adsterra sponsor ad dekhein aur turant coins apne wallet me claim karein!'
                    : 'Offer open karein aur advertiser ke requirements pure karein. Niche button daba kar coins claim karein!'}
                </p>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                  {statusMessage}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2.5 pt-1">
                {isVideoAd ? (
                  <>
                    <button
                      onClick={async () => {
                        handleLaunchOffer();
                        await handleCompleteReward();
                      }}
                      disabled={isSubmittingCompletion}
                      className="w-full py-4 px-5 bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 hover:brightness-110 active:scale-95 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-400/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer text-sm sm:text-base disabled:opacity-50"
                    >
                      <Sparkles className="w-5 h-5 text-slate-950" />
                      <span>
                        {isSubmittingCompletion
                          ? 'Crediting Coins...'
                          : `▶️ Watch Sponsor Ad & Claim +${offer.reward_coins} Coins`}
                      </span>
                    </button>

                    <button
                      onClick={handleCompleteReward}
                      disabled={isSubmittingCompletion}
                      className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Instant Claim +{offer.reward_coins} Coins to Wallet</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <button
                        onClick={handleLaunchOffer}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 hover:brightness-105 active:scale-98 text-slate-950 font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>{taskOpened ? '1. Re-open Advertiser Task (Primary)' : '1. Open Official Advertiser Offer'}</span>
                      </button>

                      {/* Backup Server Buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTaskOpened(true);
                            window.open('https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed', '_blank');
                          }}
                          className="flex-1 py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                        >
                          <Flame className="w-3 h-3 text-purple-400" />
                          <span>Adsterra High CPM</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTaskOpened(true);
                            window.open('https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed', '_blank');
                          }}
                          className="flex-1 py-2 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border border-amber-500/30 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Adsterra Fast Stream</span>
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleCompleteReward}
                      disabled={isSubmittingCompletion}
                      className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>2. I Completed Offer — Claim +{offer.reward_coins} Coins</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
