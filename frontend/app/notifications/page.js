'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/layout/AppShell';
import { api, formatDate } from '../../lib/api';
import { Bell, Check, Trash2, Info, AlertTriangle, TrendingUp, TrendingDown, Inbox } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type) => {
    if (type.startsWith('budget_100')) return <AlertTriangle size={18} />;
    if (type.startsWith('budget_80') || type.startsWith('budget_90')) return <Bell size={18} />;
    if (type.startsWith('weekly_spike')) return <TrendingUp size={18} />;
    if (type.startsWith('weekly_spending_lower')) return <TrendingDown size={18} />;
    if (type.startsWith('weekly_reminder') || type.startsWith('monthly_summary')) return <Info size={18} />;
    if (type.startsWith('badge_')) return <Check size={18} />;
    if (type === 'income') return <TrendingUp size={18} />;
    if (type === 'expense') return <TrendingDown size={18} />;
    return <Info size={18} />;
  };

  const getIconColor = (type) => {
    if (type.startsWith('budget_100') || type.startsWith('weekly_spike')) return 'var(--danger)';
    if (type.startsWith('budget_80') || type.startsWith('budget_90')) return '#d97706';
    if (type.startsWith('weekly_spending_lower') || type.startsWith('badge_')) return 'var(--income-color)';
    if (type === 'income') return 'var(--income-color)';
    if (type === 'expense') return 'var(--expense-color)';
    return 'var(--accent)';
  };

  return (
    <AppShell title="Notifications">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Alert Center</p>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 26, color: 'var(--text-primary)' }}>System Updates</h2>
          </div>
          <button className="btn-ghost" onClick={load} style={{ fontSize: 13 }}>Refresh</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <Bell size={32} className="animate-pulse" style={{ margin: '0 auto 12px' }} />
            <p>Syncing alerts...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Inbox size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-muted)' }}>Your inbox is empty. No new notifications.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map(n => (
              <div key={n.id} className="card" style={{ 
                padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start',
                opacity: n.is_read ? 0.7 : 1, transition: 'all 0.2s',
                borderLeft: n.is_read ? '1px solid var(--border)' : `4px solid ${getIconColor(n.type)}`,
                cursor: n.action_url ? 'pointer' : 'default'
              }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: n.is_read ? 'var(--bg-primary)' : 'var(--accent-light)', 
                  color: n.is_read ? 'var(--text-muted)' : getIconColor(n.type),
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {getIcon(n.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <p
                      style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}
                      onClick={() => n.action_url && router.push(n.action_url)}
                    >
                      {n.title}
                    </p>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(n.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>{n.message}</p>
                  
                  <div style={{ display: 'flex', gap: 12 }}>
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                        <Check size={14} /> Mark as Read
                      </button>
                    )}
                    <button onClick={() => remove(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
