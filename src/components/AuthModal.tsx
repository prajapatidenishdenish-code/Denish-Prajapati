import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { clientRegisterUser, clientLoginUser } from '../services/authClient.ts';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Logo } from './Logo.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  referralCodeFromUrl?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  referralCodeFromUrl = '',
}) => {
  const { loginUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  // Sync mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMsg(null);
      if (referralCodeFromUrl) {
        setRegReferralCode(referralCodeFromUrl);
      }
    }
  }, [isOpen, initialMode, referralCodeFromUrl]);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form State (Isolated from login to prevent autofill collision)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regReferralCode, setRegReferralCode] = useState(referralCodeFromUrl);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time password match checks for register
  const passwordsMatch = regPassword.length > 0 && regPassword === regConfirmPassword;
  const passwordsMismatch = regConfirmPassword.length > 0 && regPassword !== regConfirmPassword;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation with clean error messages
    if (!regName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!regEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please ensure Password and Confirm Password are identical.');
      return;
    }
    if (!acceptTerms) {
      setError('Please agree to the Terms of Service to create an account.');
      return;
    }

    setLoading(true);
    try {
      const data = await clientRegisterUser({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        confirmPassword: regConfirmPassword,
        referralCode: regReferralCode.trim(),
        acceptTerms: true,
      });

      loginUser(data.token, data.user, data.wallet);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register account. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await clientLoginUser(loginEmail.trim(), loginPassword);
      loginUser(data.token, data.user, data.wallet);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setSuccessMsg(data.message);
      } else {
        setSuccessMsg('If an account exists with this email, password reset instructions have been dispatched.');
      }
    } catch (err: any) {
      setSuccessMsg('If an account exists with this email, password reset instructions have been dispatched.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Glow ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <Logo size="md" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Your Free Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' && 'Sign in to access your wallet, watch tasks and cashout.'}
            {mode === 'register' && 'Get 100 free bonus coins immediately upon registration.'}
            {mode === 'forgot' && 'Enter your registered email to receive reset instructions.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Mode Switch Tabs */}
        {mode !== 'forgot' && (
          <div className="flex p-1 bg-slate-950/60 rounded-xl mb-5 border border-slate-800">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login' ? 'bg-slate-800 text-amber-400 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register' ? 'bg-slate-800 text-amber-400 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register (Free)
            </button>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                    setForgotEmail(loginEmail);
                  }}
                  className="text-amber-400 hover:underline text-[11px] cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 active:scale-98 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In to Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick 1-Click Instant Demo Login for Testing */}
            <div className="pt-1">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    const data = await clientLoginUser('alex@example.com', 'password123');
                    loginUser(data.token, data.user, data.wallet);
                    onClose();
                  } catch {
                    try {
                      const data = await clientRegisterUser({
                        name: 'Denish Tester',
                        email: `tester_${Date.now()}@test.com`,
                        password: 'password123',
                        confirmPassword: 'password123',
                        acceptTerms: true,
                      });
                      loginUser(data.token, data.user, data.wallet);
                      onClose();
                    } catch (e: any) {
                      setError('Could not auto-login: ' + e.message);
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded-xl border border-amber-500/30 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ 1-Click Quick Login (Instant Test Account)</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Password (min 6 chars)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Create strong password"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password with Live Matching Feedback */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Confirm Password</label>
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
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repeat your password exactly"
                  className={`w-full bg-slate-950/80 border rounded-xl pl-9 pr-10 py-2 text-white placeholder-slate-500 focus:outline-none text-xs ${
                    passwordsMatch
                      ? 'border-emerald-500/80 focus:border-emerald-400'
                      : passwordsMismatch
                      ? 'border-amber-500/80 focus:border-amber-400'
                      : 'border-slate-700 focus:border-amber-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Referral Code */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Referral Code <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={regReferralCode}
                onChange={(e) => setRegReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. ADEARN-ALEX77"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono text-xs uppercase"
              />
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-400 leading-tight cursor-pointer">
                I agree to the <span className="text-amber-400">Terms of Service</span> and acknowledge strict anti-bot and
                single-account rules.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptTerms}
              className="w-full py-3 bg-gradient-to-r from-emerald-400 to-amber-400 hover:brightness-105 active:scale-98 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account...' : 'Claim 100 Free Coins & Register'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Registered Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Password Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className="w-full text-center text-slate-400 hover:text-white py-1 transition-colors cursor-pointer"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
