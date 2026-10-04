import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do rewards and coins work on AdEarn Pro?',
      a: 'Advertisers pay us when genuine users watch sponsor videos or complete verified actions (like taking a survey, trying a game, or signing up for a service). We convert this advertising revenue into integer-based internal units called Coins (1,000 Coins = $1.00 USD) and credit them straight to your personal wallet.',
    },
    {
      q: 'Why didn’t I get credited immediately when I clicked an offer?',
      a: 'To maintain platform integrity and protect advertisers, rewards are never credited simply because a link was clicked. You must complete the required criteria (such as watching the full 15-30s video, or reaching the required milestone in an app). Once the advertising provider confirms a valid conversion signal via server-side postback, your balance is credited instantly.',
    },
    {
      q: 'What is the minimum withdrawal amount?',
      a: 'The minimum withdrawal threshold is 5,000 Coins ($5.00 USD). This prevents excessive banking processing fees and allows us to provide 100% free payouts with zero fees to you.',
    },
    {
      q: 'How long does withdrawal processing take?',
      a: 'Withdrawals are typically reviewed and disbursed within 24 to 48 business hours. Each request is validated to ensure there are no duplicate requests or fraudulent bot activities.',
    },
    {
      q: 'Which payment methods are supported for cashing out?',
      a: 'We currently support UPI (for India), PayPal (international), Direct Bank Wire Transfer, and USDT Cryptocurrency (TRC-20 / Polygon). You can select your preferred method on the Wallet page.',
    },
    {
      q: 'What account restrictions are enforced to prevent fraud?',
      a: 'We enforce a strict 1-account-per-person policy. The use of proxies, VPNs, emulators, auto-clickers, bots, or multiple accounts under the same IP will trigger our anti-fraud detection system and may lead to account suspension.',
    },
    {
      q: 'What should I do if a conversion fails or is not credited?',
      a: 'Conversions can occasionally take 5-10 minutes to propagate through third-party ad networks. Ensure you completed all listed requirements without ad-blockers enabled. If an offer still fails to credit after 30 minutes, you can contact our support team with your offer title.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 mb-1">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Frequently Asked Questions</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Everything you need to know about coin rewards, watch tasks, CPA postbacks, and withdrawals.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer font-bold text-sm text-white hover:text-amber-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-amber-400' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
