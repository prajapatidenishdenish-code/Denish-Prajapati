import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-300 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Terms and Conditions</h1>
        <p className="text-xs text-slate-400 mt-1">Last updated: September 2026</p>
      </div>

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          <b>Incentivized Traffic Notice:</b> AdEarn Pro strictly operates according to approved advertiser guidelines.
          Automated bot activity, click farms, VPN circumvention, auto-refreshers, and multi-accounting are strictly
          prohibited and will result in permanent disqualification.
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-400 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Eligibility and Account Registration</h2>
          <p>
            Users must be at least 13 years of age (or the legal age of consent in your jurisdiction). Each individual
            is permitted only ONE active account. Multiple registrations originating from the same household or IP
            for the purpose of duplicating rewards constitute fraud.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Reward Crediting and Conversions</h2>
          <p>
            Coins are internal ledger units with an exchange benchmark of 1,000 Coins = $1.00 USD. Rewards are only
            credited upon receipt of a cryptographically verified server-side postback from the affiliated advertising network.
            Mere clicks or incomplete sessions will not trigger coin allocation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Withdrawals and Payout Processing</h2>
          <p>
            Withdrawal requests require a verified minimum of 5,000 Coins ($5.00 USD). All payout requests are subject to
            fraud screening and admin audit. If a user is suspected of fraudulent task completion, the platform reserves the
            right to delay or deny payout and refund the disputed transactions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. Modifications and Termination</h2>
          <p>
            AdEarn Pro reserves the right to modify exchange rates, available offers, and withdrawal thresholds at any
            time to preserve network viability.
          </p>
        </section>
      </div>
    </div>
  );
};
