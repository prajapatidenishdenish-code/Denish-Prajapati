import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { User, ShieldCheck, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccess(null);
    setPwError(null);

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      setPwSuccess('Password successfully updated!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Account & Security</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your personal details, referral credentials, and security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 p-0.5 shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center font-bold text-2xl text-amber-400">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{user.name}</h3>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Account ID:</span>
              <span className="text-slate-300 font-mono">#{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Referral Code:</span>
              <span className="text-amber-400 font-mono font-bold">{user.referral_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Risk Standing:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Good (Score: {user.risk_score}/100)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Country:</span>
              <span className="text-slate-300 font-bold">{user.country || 'Global'}</span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Update Password</h3>
          </div>

          {pwError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{pwError}</span>
            </div>
          )}

          {pwSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{pwSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">New Password (min 6 chars)</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 pr-10 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">Confirm New Password</label>
                {passwordsMatch && (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match!
                  </span>
                )}
                {passwordsMismatch && (
                  <span className="text-[11px] text-amber-400 font-medium">
                    Passwords do not match yet
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password exactly"
                  className={`w-full bg-slate-950 border rounded-xl px-3 pr-10 py-2.5 text-white focus:outline-none ${
                    passwordsMatch
                      ? 'border-emerald-500/80 focus:border-emerald-400'
                      : passwordsMismatch
                      ? 'border-amber-500/80 focus:border-amber-400'
                      : 'border-slate-800 focus:border-amber-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-6 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
