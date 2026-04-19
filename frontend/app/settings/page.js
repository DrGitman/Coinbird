'use client';
import { useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const [settings, setSettings] = useState({
    currency: user?.currency || 'USD',
    timezone: user?.timezone || 'UTC',
    theme: user?.theme || 'light',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showDeactivate, setShowDeactivate] = useState(false);

  const set = (k, v) => setSettings(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess(false);
    try {
      const updated = await api.updateSettings(settings);
      updateUser(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const currencies = [
    { code: 'USD', label: 'USD ($) — US Dollar' },
    { code: 'EUR', label: 'EUR (€) — Euro' },
    { code: 'GBP', label: 'GBP (£) — British Pound' },
    { code: 'CAD', label: 'CAD ($) — Canadian Dollar' },
    { code: 'AUD', label: 'AUD ($) — Australian Dollar' },
    { code: 'JPY', label: 'JPY (¥) — Japanese Yen' },
    { code: 'CHF', label: 'CHF — Swiss Franc' },
    { code: 'INR', label: 'INR (₹) — Indian Rupee' },
    { code: 'NAD', label: 'NAD ($) — Namibian Dollar' },
    { code: 'ZAR', label: 'ZAR (R) — South African Rand' },
  ];

  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
    'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney', 'Africa/Windhoek',
  ];

  const sectionStyle = { marginBottom: 28 };
  const sectionLabelStyle = { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 };

  return (
    <AppShell title="Settings">
      <div style={{ maxWidth: 640 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Preferences</p>

        {error && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 20 }}>{error}</div>}
        {success && <div style={{ background: 'var(--accent-light)', color: 'var(--income-color)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 20 }}>✓ Settings saved!</div>}

        {/* Appearance */}
        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <div style={sectionStyle}>
            <p style={sectionLabelStyle}>Visual — Appearance</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { val: 'light', icon: '☀️', label: 'Light Theme', desc: 'Inspired by morning dew and fresh botanical growth.' },
                { val: 'dark', icon: '🌙', label: 'Dark Theme', desc: 'A deep, calm environment for late-night budgeting.' },
              ].map(t => (
                <button key={t.val} onClick={() => set('theme', t.val)}
                  style={{
                    padding: '16px 18px', borderRadius: 14, textAlign: 'left',
                    border: `2px solid ${settings.theme === t.val ? 'var(--accent)' : 'var(--border)'}`,
                    background: settings.theme === t.val ? 'var(--accent-light)' : 'var(--bg-primary)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{t.icon}</span>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: `2px solid ${settings.theme === t.val ? 'var(--accent)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {settings.theme === t.val && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />}
                    </div>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{t.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Localization */}
        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <div style={sectionStyle}>
            <p style={sectionLabelStyle}>Regional — Localization</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: '20px', borderRadius: 14, background: 'var(--accent-light)', border: '1px solid var(--border)' }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>Primary Currency</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.4 }}>
                  Select how balances and growth indicators are calculated.
                </p>
                <select className="input" value={settings.currency} onChange={e => set('currency', e.target.value)}>
                  {currencies.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ padding: '20px', borderRadius: 14, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>Timezone</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.4 }}>
                  Your local time for transaction dating.
                </p>
                <select className="input" value={settings.timezone} onChange={e => set('timezone', e.target.value)}>
                  {timezones.map(tz => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 160, justifyContent: 'center' }}>
            {saving ? '🌱 Saving…' : '✓ Save Settings'}
          </button>
        </div>

        {/* Danger zone */}
        <div className="card" style={{ padding: 28, border: '1px solid #fee2e2' }}>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--danger)', marginBottom: 8 }}>Account Management</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            Permanently remove all data, transactions, and botanical growth history. This action cannot be reversed.
          </p>
          <button className="btn-danger" onClick={() => setShowDeactivate(true)}>Deactivate Account</button>
        </div>

        {showDeactivate && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: 380 }}>
              <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, marginBottom: 10 }}>Are you sure?</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                This will permanently delete your account and all associated data. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowDeactivate(false)}>Cancel</button>
                <button className="btn-danger" style={{ flex: 1 }} onClick={() => { logout(); }}>Yes, Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

