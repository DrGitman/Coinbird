'use client';
import { useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { Sun, Moon, Check, Bell, Globe, Palette, ShieldAlert, Mail, Zap, Trophy } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const [settings, setSettings] = useState({
    currency:            user?.currency            || 'USD',
    timezone:            user?.timezone            || 'UTC',
    theme:               user?.theme               || 'light',
    notif_email:         user?.notif_email         !== undefined ? user.notif_email         : true,
    notif_budget_alerts: user?.notif_budget_alerts !== undefined ? user.notif_budget_alerts : true,
    notif_push:          user?.notif_push          !== undefined ? user.notif_push          : false,
    notif_budget_warning:  user?.notif_budget_warning  !== undefined ? user.notif_budget_warning  : true,
    notif_budget_exceeded: user?.notif_budget_exceeded !== undefined ? user.notif_budget_exceeded : true,
    notif_overspending:    user?.notif_overspending    !== undefined ? user.notif_overspending    : true,
    notif_reminders:       user?.notif_reminders       !== undefined ? user.notif_reminders       : true,
    notif_monthly_summary: user?.notif_monthly_summary !== undefined ? user.notif_monthly_summary : true,
    notif_milestones:      user?.notif_milestones      !== undefined ? user.notif_milestones      : true,
  });
  const [saving, setSaving]           = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState('');
  const [showDeactivate, setShowDeactivate] = useState(false);

  const set = (k, v) => setSettings(p => ({ ...p, [k]: v }));

  /* Set a group of keys to the same boolean value */
  const setGroup = (keys, v) =>
    setSettings(p => keys.reduce((acc, k) => ({ ...acc, [k]: v }), { ...p }));

  /* A group is "on" when ALL its keys are true */
  const groupOn = (keys) => keys.every(k => settings[k]);

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

  /* ── 4 consolidated notification groups ──────────────────────────────── */
  const NOTIF_GROUPS = [
    {
      icon: <ShieldAlert size={20} />,
      label: 'Budget Alerts',
      desc: 'Warnings at 80% and 90%, exceeded alerts, and overspending signals.',
      keys: ['notif_budget_alerts', 'notif_budget_warning', 'notif_budget_exceeded', 'notif_overspending'],
    },
    {
      icon: <Mail size={20} />,
      label: 'Reports & Reminders',
      desc: 'Monthly summaries, email digests, and periodic logging reminders.',
      keys: ['notif_email', 'notif_monthly_summary', 'notif_reminders'],
    },
    {
      icon: <Trophy size={20} />,
      label: 'Achievements',
      desc: 'Notifications when you earn new badges and hit financial milestones.',
      keys: ['notif_milestones'],
    },
    {
      icon: <Zap size={20} />,
      label: 'Browser Push',
      desc: 'Real-time alerts directly in your browser or on your mobile device.',
      keys: ['notif_push'],
      onToggle: async (checked) => {
        set('notif_push', checked);
        window.dispatchEvent(new CustomEvent(checked ? 'coinbird-push-on' : 'coinbird-push-off'));
      },
    },
  ];

  return (
    <AppShell title="Application Settings">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Configuration</p>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: 'var(--text-primary)' }}>Preferences</h2>
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 160, justifyContent: 'center', gap: 8 }}>
            {saving ? <Zap size={18} className="animate-pulse" /> : <Check size={18} />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 12, padding: '14px 18px', fontSize: 14, marginBottom: 24 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'var(--accent-light)', color: 'var(--income-color)', borderRadius: 12, padding: '14px 18px', fontSize: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Check size={18} /> Your settings have been successfully updated.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Appearance */}
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Palette size={20} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20 }}>Visual Interface</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { val: 'light', icon: <Sun size={20} />,  label: 'Light Theme', desc: 'A clean and bright interface for daytime budgeting.' },
                { val: 'dark',  icon: <Moon size={20} />, label: 'Dark Theme',  desc: 'A deep, high-contrast mode for focused financial reviews.' },
              ].map(t => (
                <button key={t.val} onClick={() => set('theme', t.val)}
                  style={{
                    padding: '18px', borderRadius: 16, textAlign: 'left',
                    border: `2px solid ${settings.theme === t.val ? 'var(--accent)' : 'var(--border)'}`,
                    background: settings.theme === t.val ? 'var(--accent-light)' : 'var(--bg-primary)',
                    cursor: 'pointer', transition: 'all 0.15s', display: 'flex', gap: 16,
                  }}>
                  <div style={{ color: settings.theme === t.val ? 'var(--accent)' : 'var(--text-muted)' }}>{t.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{t.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.desc}</p>
                  </div>
                  {settings.theme === t.val && <Check size={16} style={{ color: 'var(--accent)' }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Localization */}
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Globe size={20} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20 }}>Regional &amp; Local</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Primary Currency</label>
                <select className="input" value={settings.currency} onChange={e => set('currency', e.target.value)}>
                  {currencies.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>System Timezone</label>
                <select className="input" value={settings.timezone} onChange={e => set('timezone', e.target.value)}>
                  {timezones.map(tz => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notifications — 4 clean toggles ────────────────────────────── */}
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Bell size={20} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20 }}>Notifications</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            Choose what keeps you informed. You can always adjust these later.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {NOTIF_GROUPS.map((grp, i) => {
              const isOn   = groupOn(grp.keys);
              const isLast = i === NOTIF_GROUPS.length - 1;
              return (
                <div key={grp.label} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 0',
                  borderBottom: isLast ? 'none' : '1px solid var(--border)',
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                    background: isOn ? 'var(--accent-light)' : 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    color: isOn ? 'var(--accent)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {grp.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{grp.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{grp.desc}</p>
                  </div>

                  {/* Toggle */}
                  <label className="toggle" style={{ flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={async (e) => {
                        if (grp.onToggle) {
                          await grp.onToggle(e.target.checked);
                        } else {
                          setGroup(grp.keys, e.target.checked);
                        }
                      }}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ padding: 32, border: '1px solid var(--danger-light)', background: 'rgba(220,38,38,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <ShieldAlert size={20} style={{ color: 'var(--danger)' }} />
            <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--danger)' }}>Danger Zone</h3>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6, maxWidth: 600 }}>
            Permanently remove your account and all financial history from our secure servers. This operation is irreversible and all data will be lost immediately.
          </p>
          <button className="btn-danger" onClick={() => setShowDeactivate(true)} style={{ fontWeight: 700 }}>
            Permanently Deactivate Account
          </button>
        </div>

        {showDeactivate && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: 380 }}>
              <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, marginBottom: 12 }}>Absolute Confirmation</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                Are you absolutely sure? This will wipe your entire financial presence on Coinbird. There is no recovery.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowDeactivate(false)}>Cancel</button>
                <button className="btn-danger" style={{ flex: 1 }} onClick={() => { logout(); }}>Yes, Delete Everything</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
