import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Admin, Wallet, InAppNotification } from '../server/types.ts';

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  wallet: Wallet | null;
  token: string | null;
  adminToken: string | null;
  isLoading: boolean;
  notifications: InAppNotification[];
  unreadCount: number;
  loginUser: (token: string, user: User, wallet?: Wallet) => void;
  loginAdmin: (token: string, admin: Admin) => void;
  logoutUser: () => void;
  logoutAdmin: () => void;
  refreshUser: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('adearn_cached_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(() => {
    try {
      const cached = localStorage.getItem('adearn_cached_wallet');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('adearn_user_token'));
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('adearn_admin_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  const fetchUserData = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setWallet(data.wallet);
          try {
            localStorage.setItem('adearn_cached_user', JSON.stringify(data.user));
            if (data.wallet) localStorage.setItem('adearn_cached_wallet', JSON.stringify(data.wallet));
          } catch {}
        }
      } else {
        // Network lag, backend restart, or static host: Keep user permanently logged in!
        try {
          const cachedUser = localStorage.getItem('adearn_cached_user');
          const cachedWallet = localStorage.getItem('adearn_cached_wallet');
          if (cachedUser) setUser(JSON.parse(cachedUser));
          if (cachedWallet) setWallet(JSON.parse(cachedWallet));
        } catch {}
      }
    } catch {
      // Offline fallback: Keep user logged in from local cache!
      try {
        const cachedUser = localStorage.getItem('adearn_cached_user');
        const cachedWallet = localStorage.getItem('adearn_cached_wallet');
        if (cachedUser) setUser(JSON.parse(cachedUser));
        if (cachedWallet) setWallet(JSON.parse(cachedWallet));
      } catch {}
    }
  }, []);

  const fetchNotifications = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const list = await res.json();
        setNotifications(list);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      if (token) {
        await fetchUserData(token);
        await fetchNotifications(token);
      }
      setIsLoading(false);
    };
    init();
  }, [token, fetchUserData, fetchNotifications]);

  const loginUser = (newToken: string, newUser: User, newWallet?: Wallet) => {
    setToken(newToken);
    setUser(newUser);
    if (newWallet) setWallet(newWallet);
    try {
      localStorage.setItem('adearn_user_token', newToken);
      localStorage.setItem('adearn_cached_user', JSON.stringify(newUser));
      if (newWallet) localStorage.setItem('adearn_cached_wallet', JSON.stringify(newWallet));
    } catch {}
    fetchNotifications(newToken);
  };

  const loginAdmin = (newAdminToken: string, newAdmin: Admin) => {
    setAdminToken(newAdminToken);
    setAdmin(newAdmin);
    localStorage.setItem('adearn_admin_token', newAdminToken);
  };

  const logoutUser = () => {
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setToken(null);
    setUser(null);
    setWallet(null);
    setNotifications([]);
    try {
      localStorage.removeItem('adearn_user_token');
      localStorage.removeItem('adearn_cached_user');
      localStorage.removeItem('adearn_cached_wallet');
    } catch {}
  };

  const logoutAdmin = () => {
    setAdminToken(null);
    setAdmin(null);
    localStorage.removeItem('adearn_admin_token');
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserData(token);
      await fetchNotifications(token);
    }
  };

  const markNotificationRead = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!token) return;
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        wallet,
        token,
        adminToken,
        isLoading,
        notifications,
        unreadCount,
        loginUser,
        loginAdmin,
        logoutUser,
        logoutAdmin,
        refreshUser,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
