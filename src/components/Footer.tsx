import React from 'react';
import { Logo } from './Logo.tsx';
import { ShieldCheck, Lock, Award, Heart } from 'lucide-react';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab }) => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800/80 pt-12 pb-24 md:pb-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand & Ethics */}
          <div className="space-y-4 md:col-span-1">
            <Logo size="md" />
            <p className="text-slate-400 text-xs leading-relaxed">
              AdEarn Pro is an ethical, verified rewards platform connecting users with verified advertiser sponsors,
              interactive CPA tasks, and instant multi-channel payouts.
            </p>
            <div className="flex items-center gap-3 text-slate-500 pt-1">
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Anti-Bot Protected
              </span>
              <span className="flex items-center gap-1 text-[11px] text-amber-400">
                <Lock className="w-3.5 h-3.5" /> SSL Encrypted
              </span>
            </div>
          </div>

          {/* Col 2: Platform */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">Earn & Payouts</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setCurrentTab('earn')} className="hover:text-amber-400 transition-colors">
                  Watch Video Ads
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('earn')} className="hover:text-amber-400 transition-colors">
                  CPA Tasks & Quizzes
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('wallet')} className="hover:text-amber-400 transition-colors">
                  UPI & PayPal Payouts
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('referrals')} className="hover:text-amber-400 transition-colors">
                  10% Referral Program
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Support & Legal */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">Legal & Security</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setCurrentTab('terms')} className="hover:text-amber-400 transition-colors">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('privacy')} className="hover:text-amber-400 transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('faq')} className="hover:text-amber-400 transition-colors">
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('about')} className="hover:text-amber-400 transition-colors">
                  About Our Network
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Network Compliance Notice */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">Compliance & Ethics</h4>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-[11px] text-slate-400 leading-normal">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Award className="w-3.5 h-3.5" />
                <span>Advertiser Guidelines</span>
              </div>
              <p>
                AdEarn Pro does not permit bots, autoclickers, VPN exploits, or duplicate accounts. All conversions are verified
                via server-side postbacks from authorized ad networks.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} AdEarn Pro. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentTab('contact')} className="hover:text-slate-300">
              Contact Support
            </button>
            <span>•</span>
            <button onClick={() => setCurrentTab('admin')} className="text-amber-500 hover:text-amber-400">
              Admin Gateway
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
