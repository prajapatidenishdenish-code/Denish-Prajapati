import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-300 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-slate-400 mt-1">Effective Date: September 2026</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-400 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Data Minimization Principles</h2>
          <p>
            AdEarn Pro collects only essential information required to service your account: your display name, email
            address, encrypted password hash, and payment routing coordinates (such as your UPI ID, PayPal email, or bank details
            provided solely for withdrawal disbursement).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Anti-Abuse & Technical Logging</h2>
          <p>
            To prevent fraud, account takeover, and automated bot manipulation, we log IP addresses, session timestamps,
            and user-agent headers associated with offer initialization and conversion postbacks.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Third-Party Advertising Networks</h2>
          <p>
            When initiating a third-party offer (such as CPAGrip), your browser may navigate to approved advertiser destinations.
            These networks handle your session in accordance with their respective privacy policies. We do not sell your personal
            identifiable information to third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. User Rights and Deletion</h2>
          <p>
            You may request complete account erasure and data deletion at any time by contacting our support team.
          </p>
        </section>
      </div>
    </div>
  );
};
