import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { AuthModal } from './components/AuthModal.tsx';

// Pages
import { HomePage } from './pages/HomePage.tsx';
import { EarnPage } from './pages/EarnPage.tsx';
import { WalletPage } from './pages/WalletPage.tsx';
import { ReferralsPage } from './pages/ReferralsPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { FaqPage } from './pages/FaqPage.tsx';
import { TermsPage } from './pages/TermsPage.tsx';
import { PrivacyPage } from './pages/PrivacyPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [referralCodeFromUrl, setReferralCodeFromUrl] = useState('');

  // Handle URL query parameters for referral and direct paths
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        setReferralCodeFromUrl(ref);
        setAuthModalMode('register');
        setAuthModalOpen(true);
      }

      if (window.location.pathname === '/admin') {
        setCurrentTab('admin');
      }
    }
  }, []);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        openAuthModal={openAuth}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentTab === 'home' && <HomePage setCurrentTab={setCurrentTab} openAuthModal={openAuth} />}
        {currentTab === 'earn' && <EarnPage openAuthModal={openAuth} setCurrentTab={setCurrentTab} />}
        {currentTab === 'wallet' && <WalletPage openAuthModal={openAuth} />}
        {currentTab === 'referrals' && <ReferralsPage openAuthModal={openAuth} />}
        {currentTab === 'about' && <AboutPage />}
        {currentTab === 'faq' && <FaqPage />}
        {currentTab === 'terms' && <TermsPage />}
        {currentTab === 'privacy' && <PrivacyPage />}
        {currentTab === 'contact' && <ContactPage />}
        {currentTab === 'profile' && <ProfilePage />}
        {currentTab === 'admin' && <AdminPage />}
      </main>

      {/* Footer */}
      <Footer
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Mobile Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        openAuthModal={openAuth}
      />

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        referralCodeFromUrl={referralCodeFromUrl}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
