'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import Sidebar from './Sidebar';
import { Menu, Sprout, Search, Bell, Settings as SettingsIcon } from 'lucide-react';
import { api, API_URL } from '../../lib/api';
import Image from 'next/image';
import logoSquare from '../../app/assets/images/logo.png';

export default function AppShell({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasUnread, setHasUnread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    const checkNotifs = () => {
      api.getNotifications()
        .then(notifs => {
          setHasUnread(notifs.some(n => !n.is_read));
        })
        .catch(err => console.error('Failed to fetch notifications:', err));
    };

    checkNotifs();
    const interval = setInterval(checkNotifs, 30000); // 30s polling

    const handlePushOn = () => {
      // Look for the registration function defined below this effect
      window.__cb_register_sw && window.__cb_register_sw();
    };

    const handlePushOff = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await api.unsubscribePush(subscription.endpoint);
        }
      } catch (err) {
        console.error('Failed to unsubscribe push:', err);
      }
    };

    window.addEventListener('coinbird-push-on', handlePushOn);
    window.addEventListener('coinbird-push-off', handlePushOff);

    return () => {
      clearInterval(interval);
      window.removeEventListener('coinbird-push-on', handlePushOn);
      window.removeEventListener('coinbird-push-off', handlePushOff);
    };
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('coinbird_user_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('coinbird_user_theme', 'light');
    }
  }, [user?.theme]);

  // Web Push & Service Worker Registration
  useEffect(() => {
    if (!user || typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const VAPID_PUBLIC_KEY = 'BMf0a98-YCTujALsjBg6udJs1il-uJ69EKLKP7Vz3KvOg77twXXDzuXnYw1YyD-qoDdgde2zNSYfYO_f_k7ykWqA';

    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
      return outputArray;
    }

    const registerPush = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          await api.subscribePush(existingSubscription);
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        await api.subscribePush(subscription);
      } catch (err) {
        console.error('Push registration error:', err);
      }
    };

    window.__cb_register_sw = registerPush;

    if (user?.notif_push) {
      registerPush();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}><Image src={logoSquare} width={40} height={40} alt="Coinbird" className="object-contain" /></div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Preparing your budget…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: 220 }}>
            {/* Mobile hamburger */}
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-primary)', fontSize: 20 }}
            >
              <Menu size={24} />
            </button>
            {title && (
              <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {title}
              </h1>
            )}
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-[460px] mx-8 justify-center">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Search transactions, insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const trimmed = searchQuery.trim();
                    router.push(trimmed ? `/transactions?q=${encodeURIComponent(trimmed)}` : '/transactions');
                  }
                }}
                style={{ 
                  width: '100%', 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 12, 
                  padding: '8px 12px 8px 36px', 
                  fontSize: 14, 
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 220, justifyContent: 'flex-end' }}>
            <button 
              onClick={() => router.push('/notifications')}
              style={{ background: 'none', border: 'none', padding: 8, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative' }}>
              <Bell size={20} />
              {hasUnread && (
                <span style={{ 
                  position: 'absolute', top: 6, right: 6, 
                  width: 9, height: 9, borderRadius: '50%', 
                  background: '#22c55e', border: '2px solid var(--bg-card)' 
                }} />
              )}
            </button>
            <button 
              onClick={() => router.push('/settings')}
              style={{ background: 'none', border: 'none', padding: 8, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <SettingsIcon size={20} />
            </button>
            <div 
              onClick={() => router.push('/profile')}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, cursor: 'pointer', marginLeft: 4, overflow: 'hidden'
              }}>
              {user?.avatar_url
                ? <img 
                    src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API_URL}${user.avatar_url}`} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                : <Sprout size={18} className="text-[var(--accent)]" />}
            </div>
          </div>
        </header>

        {/* Main scroll area */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          padding: '28px',
          animation: 'pageIn 0.25s ease-out both',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
