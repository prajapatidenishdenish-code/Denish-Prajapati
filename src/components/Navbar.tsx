import React, { useState } from 'react';
import { Logo } from './Logo.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Coins,
  Bell,
  User as UserIcon,
  LogOut,
  Shield,
  Menu,
  X,
  CheckCircle2,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, openAuthModal }) => {
  const { user, wallet, unreadCount, notifications, markNotificationRead, markAllNotificationsRead, logoutUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'earn', label: 'Earn Tasks' },
    { id: 'wallet', label: 'Wallet & Payouts' },
    { id: 'referrals', label: 'Referrals' },
    { id: 'faq', label: 'FAQ' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80">
      {/* Live System Status Bar */}
      <div className="bg-gradient-to-r from-amber-600/90 via-emerald-600/90 to-amber-600/90 text-white text-[11px] font-semibold tracking-wider py-1 px-4 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span>VERIFIED EARNINGS LIVE • Real-time CPA postbacks, daily bonuses & instant rewards</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={() => setCurrentTab('home')}
          className="hover:opacity-90 transition-opacity text-left cursor-pointer"
        >
          <Logo size="md" />
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setCurrentTab(link.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentTab === link.id
                  ? 'bg-slate-800 text-amber-400 font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Balance Pill */}
              <button
                onClick={() => setCurrentTab('wallet')}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-emerald-500/10 border border-amber-500/30 rounded-full hover:border-amber-400/50 transition-all cursor-pointer shadow-sm group"
                title="Your Coin Balance"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow">
                  <Coins className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                </div>
                <div className="text-left leading-none">
                  <div className="text-xs font-black text-amber-400 font-mono tracking-tight">
                    {(wallet?.balance_coins || 0).toLocaleString()}
                    <span className="text-[10px] text-amber-500 font-sans ml-1">COINS</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    ≈ ${((wallet?.balance_coins || 0) / 1000).toFixed(2)} USD
                  </div>
                </div>
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
                    <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                      <div className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-xs text-amber-400 hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">No notifications yet.</div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => markNotificationRead(notif.id)}
                            className={`p-3 text-xs cursor-pointer transition-colors ${
                              notif.read ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-800/50 text-slate-200'
                            } hover:bg-slate-800`}
                          >
                            <div className="font-semibold flex items-center justify-between text-slate-100">
                              <span>{notif.title}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="mt-0.5 text-slate-300 leading-relaxed">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all text-xs font-medium cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-semibold text-slate-200">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 py-1 divide-y divide-slate-800 animate-in fade-in duration-150">
                    <div className="px-3 py-2">
                      <div className="font-semibold text-xs text-white truncate">{user.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setCurrentTab('profile');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>Profile & Security</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTab('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-amber-400 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Admin Dashboard</span>
                      </button>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          logoutUser();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-all cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 hover:brightness-105 active:scale-95 rounded-lg shadow-md transition-all cursor-pointer"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-3 pb-6 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setCurrentTab(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === link.id
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => {
              setCurrentTab('admin');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-amber-400 hover:bg-slate-900 flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>Admin Portal</span>
          </button>
        </div>
      )}
    </header>
  );
};
