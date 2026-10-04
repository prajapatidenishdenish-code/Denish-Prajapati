import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { Withdrawal, Transaction, WithdrawalMethod } from '../server/types.ts';
import {
  Coins,
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Send,
  Building,
  CreditCard,
  RefreshCw,
} from 'lucide-react';

interface WalletPageProps {
  openAuthModal: (mode: 'login' | 'register') => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({ openAuthModal }) => {
  const { user, wallet, refreshUser } = useAuth();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Withdrawal form
  const [method, setMethod] = useState<WithdrawalMethod>('UPI');
  const [amountCoins, setAmountCoins] = useState<string>('5000');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const minWithdrawalCoins = 5000; // 5,000 coins = $5.00 USD
  const exchangeRate = 1000; // 1000 coins = $1.00 USD

  const fetchWalletHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const token = localStorage.getItem('adearn_user_token');
    try {
      const [wRes, tRes] = await Promise.all([
        fetch('/api/wallet/withdrawals', {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }),
        fetch('/api/wallet', {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }),
      ]);

      if (wRes.ok) {
        const wData = await wRes.json();
        setWithdrawals(wData);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setTransactions(tData.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWalletHistory();
    }
  }, [user]);

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    setFormError(null);
    setFormSuccess(null);

    const coinsNum = parseInt(amountCoins, 10);
    if (isNaN(coinsNum) || coinsNum < minWithdrawalCoins) {
      setFormError(`Minimum withdrawal is ${minWithdrawalCoins.toLocaleString()} coins ($5.00 USD).`);
      return;
    }

    if ((wallet?.balance_coins || 0) < coinsNum) {
      setFormError(`Insufficient balance. You currently have ${(wallet?.balance_coins || 0).toLocaleString()} coins.`);
      return;
    }

    if (!paymentDetails || paymentDetails.trim().length < 4) {
      setFormError('Please enter valid account/payout identifier details.');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('adearn_user_token');

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amountCoins: coinsNum,
          method,
          paymentDetails: paymentDetails.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit withdrawal request.');
      }

      setFormSuccess('Withdrawal request submitted! It will be reviewed by admin within 24-48 hours.');
      setPaymentDetails('');
      await refreshUser();
      await fetchWalletHistory();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <Coins className="w-16 h-16 text-amber-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Sign In to Access Your Wallet</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          View your accumulated coin balance, track verified earnings, and withdraw real money directly to your account.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-bold rounded-xl text-sm"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const currentCoins = wallet?.balance_coins || 0;
  const currentFiat = (currentCoins / exchangeRate).toFixed(2);
  const progressPercent = Math.min(100, Math.round((currentCoins / minWithdrawalCoins) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* 1. WALLET SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Main Available Balance */}
        <div className="p-6 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/30 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Available Balance</span>
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            {currentCoins.toLocaleString()}
            <span className="text-xs font-sans text-amber-400 ml-1.5 font-bold">COINS</span>
          </div>
          <div className="text-sm font-semibold text-emerald-400 mt-1">
            ≈ ${currentFiat} USD
          </div>
        </div>

        {/* Lifetime Earnings */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Lifetime Earned</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {(wallet?.lifetime_earnings_coins || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            ≈ ${(((wallet?.lifetime_earnings_coins || 0)) / exchangeRate).toFixed(2)} USD
          </div>
        </div>

        {/* Lifetime Withdrawn */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Total Withdrawn</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {(wallet?.lifetime_withdrawals_coins || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            ≈ ${(((wallet?.lifetime_withdrawals_coins || 0)) / exchangeRate).toFixed(2)} USD
          </div>
        </div>

        {/* Exchange Rate Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Conversion Rate</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400 font-mono">
            1,000 Coins = $1.00
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Guaranteed Integer Units
          </div>
        </div>
      </div>

      {/* 2. WITHDRAWAL REQUEST & THRESHOLD SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Col */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" />
              <span>Request Payout</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your preferred withdrawal channel. Minimum required: 5,000 coins ($5.00).
            </p>
          </div>

          {/* Progress bar towards min withdrawal */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Threshold Progress: <b className="text-white">{currentCoins.toLocaleString()} / 5,000 Coins</b>
              </span>
              <span className={`font-bold ${progressPercent >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  progressPercent >= 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {formError && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleWithdrawalSubmit} className="space-y-5 text-xs">
            {/* Method Select */}
            <div>
              <label className="block text-slate-300 font-semibold mb-2">Choose Payout Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'UPI', label: 'UPI / VPA', icon: CreditCard },
                  { id: 'PAYPAL', label: 'PayPal', icon: DollarSign },
                  { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building },
                  { id: 'CRYPTO', label: 'USDT (Crypto)', icon: Coins },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id as WithdrawalMethod)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      method === item.id
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount in Coins */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 font-semibold">Coins to Withdraw</label>
                <span className="text-slate-400">
                  Equivalent: <b className="text-emerald-400">${(parseInt(amountCoins || '0', 10) / exchangeRate).toFixed(2)} USD</b>
                </span>
              </div>
              <div className="relative">
                <Coins className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min={minWithdrawalCoins}
                  step={500}
                  value={amountCoins}
                  onChange={(e) => setAmountCoins(e.target.value)}
                  placeholder="5000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[5000, 10000, 20000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountCoins(preset.toString())}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-mono text-slate-300 transition-colors"
                  >
                    {preset.toLocaleString()} Coins (${preset / 1000})
                  </button>
                ))}
                {currentCoins >= 5000 && (
                  <button
                    type="button"
                    onClick={() => setAmountCoins(currentCoins.toString())}
                    className="px-2.5 py-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg text-[10px] font-mono transition-colors"
                  >
                    Max ({currentCoins.toLocaleString()})
                  </button>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {method === 'UPI' && 'Your UPI ID / VPA'}
                {method === 'PAYPAL' && 'PayPal Account Email'}
                {method === 'BANK_TRANSFER' && 'Account No, Beneficiary Name & IFSC / Routing Code'}
                {method === 'CRYPTO' && 'TRC20 / Polygon USDT Wallet Address'}
              </label>
              <textarea
                rows={2}
                required
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                placeholder={
                  method === 'UPI'
                    ? 'e.g. yourname@okhdfcbank or 9876543210@paytm'
                    : method === 'PAYPAL'
                    ? 'e.g. payout@example.com'
                    : method === 'BANK_TRANSFER'
                    ? 'A/C: 123456789012, Name: John Doe, IFSC: HDFC0001234'
                    : 'e.g. 0x... or T...'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || currentCoins < minWithdrawalCoins}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-emerald-400 hover:brightness-105 active:scale-98 text-slate-950 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Withdrawal Request'}
            </button>
          </form>
        </div>

        {/* Guidelines / Security Side Col */}
        <div className="space-y-5">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Withdrawal Policy</span>
            </h3>
            <ul className="text-xs text-slate-400 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>
                  <b>Atomic Lock:</b> Coins are deducted immediately upon request. If a withdrawal is rejected, coins
                  are automatically refunded to your ledger.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>
                  <b>Zero Fees:</b> We do not deduct any platform or gas fees from your payouts.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>
                  <b>Speed:</b> Requests are verified within 24 to 48 hours to prevent bot abuse.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. WITHDRAWALS HISTORY */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight">Withdrawal Requests History</h3>
          <button
            onClick={fetchWalletHistory}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {withdrawals.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No withdrawal requests submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Method</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Fiat Value</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Note / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="text-slate-300">
                    <td className="py-3 font-mono">#{w.id}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-bold text-slate-200">
                        {w.method}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-amber-400">{w.amount_coins.toLocaleString()} Coins</td>
                    <td className="py-3 font-mono font-bold text-emerald-400">${w.amount_fiat.toFixed(2)} USD</td>
                    <td className="py-3">
                      {w.status === 'PAID' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      )}
                      {w.status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> Under Review
                        </span>
                      )}
                      {w.status === 'REJECTED' && (
                        <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" /> Refunded
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-400 text-[11px]">
                      {new Date(w.requested_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-slate-400 text-[11px] truncate max-w-xs">
                      {w.admin_note || w.transaction_ref || 'Pending processing'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. IMMUTABLE TRANSACTIONS LEDGER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Wallet Ledger & Transactions</h3>
        <p className="text-xs text-slate-400">
          Every reward, daily bonus, referral commission, and withdrawal is cryptographically recorded here.
        </p>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold">Coins Change</th>
                  <th className="pb-3 font-semibold">Balance After</th>
                  <th className="pb-3 font-semibold">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="text-slate-300">
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-200">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">{tx.description}</td>
                    <td className={`py-3 font-mono font-bold ${tx.amount_coins >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.amount_coins >= 0 ? `+${tx.amount_coins}` : tx.amount_coins}
                    </td>
                    <td className="py-3 font-mono text-slate-400">{tx.balance_after_coins.toLocaleString()}</td>
                    <td className="py-3 text-slate-500 text-[11px]">
                      {new Date(tx.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
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
