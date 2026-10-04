import React from 'react';
import { ShieldCheck, Award, Users, CheckCircle2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-300 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">About AdEarn Pro</h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          The next-generation rewarded advertising platform uniting advertisers and passionate online consumers.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-white">Our Mission</h2>
        <p className="text-xs sm:text-sm leading-relaxed text-slate-400">
          AdEarn Pro was built on a simple, transparent premise: user attention is valuable. Traditional digital advertising
          platforms monetize your time without sharing a cent of the revenue. AdEarn Pro disrupts this paradigm by
          partnering with top-tier global advertising networks and CPA sponsors, distributing direct revenue back to you
          in redeemable coins.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <ShieldCheck className="w-6 h-6 text-amber-400" />
          <h3 className="font-bold text-white text-base">Ethical & Transparent</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            We only support authentic human engagement. We strictly forbid bots, forced popups, or deceptive tracking.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <Award className="w-6 h-6 text-emerald-400" />
          <h3 className="font-bold text-white text-base">Verified Postbacks</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            All coin rewards are backed by server-to-server cryptographic callbacks directly from authorized networks.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <Users className="w-6 h-6 text-indigo-400" />
          <h3 className="font-bold text-white text-base">Community First</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Prompt customer support, zero payout fees, and fair withdrawal limits tailored for users worldwide.
          </p>
        </div>
      </div>
    </div>
  );
};
