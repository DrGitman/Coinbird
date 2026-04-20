'use client';
import { useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { Sun, Moon, Check, Bell, Globe, Palette, ShieldAlert, Laptop, Mail, Zap } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const [settings, setSettings] = useState({
    currency: user?.currency || 'USD',
    timezone: user?.timezone || 'UTC',
    theme: user?.theme || 'light',
    notif_email: user?.notif_email !== undefined ? user.notif_email : true,
    notif_budget_alerts: user?.notif_budget_alerts !== undefined ? user.notif_budget_alerts : true,
    notif_push: user?.notif_push !== undefined ? user.notif_push : false,
    notif_budget_warning: user?.notif_budget_warning !== undefined ? user.notif_budget_warning : true,
    notif_budget_exceeded: user?.notif_budget_exceeded !== undefined ? user.notif_budget_exceeded : true,
    notif_overspending: user?.notif_overspending !== undefined ? user.notif_overspending : true,
    notif_reminders: user?.notif_reminders !== undefined ? user.notif_reminders : true,
    notif_monthly_summary: user?.notif_monthly_summary !== undefined ? user.notif_monthly_summary : true,
    notif_milestones: user?.notif_milestones !== undefined ? user.notif_milestones : true,
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

  return (
    <AppShell title="Application Settings">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
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

        {error && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 12, padding: '14px 18px', fontSize: 14, marginBottom: 24 }}>{error}</div>}
        {success && (
          <div style={{ background: 'var(--accent-light)', color: 'var(--income-color)', borderRadius: 12, padding: '14px 18px', fontSize: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Check size={18} />
            Your settings have been successfully updated.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Appearance Section */}
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
               <Palette size={20} style={{ color: 'var(--accent)' }} />
               <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20 }}>Visual Interface</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { val: 'light', icon: <Sun size={20} />, label: 'Light Theme', desc: 'A clean and bright interface for daytime budgeting.' },
                { val: 'dark', icon: <Moon size={20} />, label: 'Dark Theme', desc: 'A deep, high-contrast mode for focused financial reviews.' },
              ].map(t => (
                <button key={t.val} onClick={() => set('theme', t.val)}
                  style={{
                    padding: '18px', borderRadius: 16, textAlign: 'left',
                    border: `2px solid ${settings.theme === t.val ? 'var(--accent)' : 'var(--border)'}`,
                    background: settings.theme === t.val ? 'var(--accent-light)' : 'var(--bg-primary)',
                    cursor: 'pointer', transition: 'all 0.15s', display: 'flex', gap: 16
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

          {/* Localization Section */}
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
               <Globe size={20} style={{ color: 'var(--accent)' }} />
               <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20 }}>Regional & Local</h3>
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

        {/* Notifications Section */}
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
             <Bell size={20} style={{ color: 'var(--accent)' }} />
             <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20 }}>Notifications & Alerts</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ display: 'flex', gap: 16, padding: '20px', borderRadius: 16, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Email Summaries</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Receive weekly reports and transaction digests.</p>
                <label className="toggle">
                  <input type="checkbox" checked={settings.notif_email} onChange={e => set('notif_email', e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, padding: '20px', borderRadius: 16, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Budget Thresholds</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Keep your core budget alerts enabled.</p>
                <label className="toggle">
                  <input type="checkbox" checked={settings.notif_budget_alerts} onChange={e => set('notif_budget_alerts', e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, padding: '20px', borderRadius: 16, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Browser Notifications</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Receive real-time alerts on your desktop or mobile.</p>
                <label className="toggle">
                  <input type="checkbox" checked={settings.notif_push} onChange={async (e) => {
                    const checked = e.target.checked;
                    set('notif_push', checked);
                    if (checked) {
                      window.dispatchEvent(new CustomEvent('coinbird-push-on'));
                    } else {
                      window.dispatchEvent(new CustomEvent('coinbird-push-off'));
                    }
                  }} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, padding: '20px', borderRadius: 16, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Budget Warnings</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>80% and 90% threshold notices before you go over.</p>
                <label className="toggle">
                  <input type="checkbox" checked={settings.notif_budget_warning} onChange={e => set('notif_budget_warning', e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, padding: '20px', borderRadius: 16, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Budget Exceeded</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Stronger alerts when a category goes over budget.</p>
                <label className="toggle">
                  <input type="checkbox" checked={settings.notif_budget_exceeded} onChange={e => set('notif_budget_exceeded', e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, padding: '20px', borderRadius: 16, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Overspending Signals</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Alerts when spending trends rise faster than usual.</p>
                <label className="toggle">
                  <input type="checkbox" checked={settings.notif_overspending} onChange={e => set('notif_overspending', e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, padding: '20px', borderRadius: 16, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Reminders</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Scheduled reminders to keep your expense logging on track.</p>
                <label className="toggle">
                  <input type="checkbox" checked={settings.notif_reminders} onChange={e => set('notif_reminders', e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, padding: '20px', borderRadius: 16, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Monthly Summaries</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>End-of-period reflection notifications with budget outcomes.</p>
                <label className="toggle">
                  <input type="checkbox" checked={settings.notif_monthly_summary} onChange={e => set('notif_monthly_summary', e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, padding: '20px', borderRadius: 16, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Milestones</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Badge and achievement notifications when you earn them.</p>
                <label className="toggle">
                  <input type="checkbox" checked={settings.notif_milestones} onChange={e => set('notif_milestones', e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ padding: 32, border: '1px solid #fee2e2', background: 'rgba(239, 68, 68, 0.02)' }}>
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
