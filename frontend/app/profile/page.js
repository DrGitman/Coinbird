'use client';
import { useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', avatar_url: user?.avatar_url || '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess(false);
    try {
      const updated = await api.updateProfile(form);
      updateUser(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: 'var(--text-secondary)', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '0.04em',
  };

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AppShell title="Profile">
      <div style={{ maxWidth: 680 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Personal Nest</p>

        {/* Avatar + info card */}
        <div className="card" style={{ padding: 28, marginBottom: 24, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--accent-light)', border: '3px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: 'var(--accent)',
            overflow: 'hidden', flexShrink: 0,
          }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 99, padding: '3px 12px', fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Primary Keeper
            </div>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 26, color: 'var(--text-primary)', marginBottom: 4 }}>
              {user?.name}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Cultivating financial freedom</p>
            <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>✉ {user?.email}</span>
            </div>
          </div>

          <div className="card" style={{ marginLeft: 'auto', padding: '18px 24px', background: 'var(--accent-light)', minWidth: 180 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Account Health</p>
            <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--text-primary)', marginBottom: 12 }}>Lush & Active</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Profile completion</p>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: user?.avatar_url ? '100%' : '70%' }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6, fontWeight: 600 }}>
              {user?.avatar_url ? '100%' : '70%'} Nurtured
            </p>
          </div>
        </div>

        {/* Edit form */}
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, marginBottom: 24 }}>Edit Profile</h3>

          {error && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          {success && <div style={{ background: 'var(--accent-light)', color: 'var(--income-color)', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 16 }}>✓ Profile updated successfully!</div>}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={labelStyle}>Display Name</label>
              <input className="input" type="text" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input className="input" type="email" value={user?.email || ''} disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed.</p>
            </div>
            <div>
              <label style={labelStyle}>Avatar URL</label>
              <input className="input" type="url" placeholder="https://example.com/avatar.jpg"
                value={form.avatar_url} onChange={e => setForm(p => ({ ...p, avatar_url: e.target.value }))} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Link to a profile image.</p>
            </div>
            <div>
              <label style={labelStyle}>Member Since</label>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ minWidth: 160, justifyContent: 'center' }}>
                {saving ? '🌱 Saving…' : '✓ Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

