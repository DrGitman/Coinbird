'use client';
import { useState, useRef } from 'react';
import AppShell from '../../components/layout/AppShell';
import { api, API_URL } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { Mail, User, Shield, Camera, Check, Sprout, Lock, Calendar } from 'lucide-react';
import PasswordChangeModal from '../../components/ui/PasswordChangeModal';
import MilestonesSection from '../../components/ui/MilestonesSection';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess(false);
    try {
      const updated = await api.updateProfile({ name });
      updateUser(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadAvatar(file);
      updateUser({ avatar_url: res.avatar_url });
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AppShell title="Account Profile">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>User Identification</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginBottom: 24, alignItems: 'start' }}>
          {/* Main Info Card */}
          <div className="card" style={{ padding: 40, display: 'flex', gap: 32, alignItems: 'center' }}>
            <div 
              onClick={handleAvatarClick}
              style={{
                width: 120, height: 120, borderRadius: '50%',
                background: 'var(--bg-primary)', border: '2px dashed var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 42, fontWeight: 700, color: 'var(--accent)',
                overflow: 'hidden', flexShrink: 0, cursor: 'pointer', position: 'relative'
              }}>
              {user?.avatar_url
                ? <img 
                    src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API_URL}${user.avatar_url}`} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                : initials}
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: uploading ? 1 : 0, transition: 'opacity 0.2s', color: 'white'
              }} className="hover-trigger">
                {uploading ? <Sprout size={24} className="animate-spin" /> : <Camera size={24} />}
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
            </div>
            <style jsx>{`
              .hover-trigger:hover { opacity: 1 !important; }
            `}</style>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 99, padding: '4px 14px', fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Account Verified
              </div>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 32, color: 'var(--text-primary)', marginBottom: 8 }}>
                {user?.name}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={16} /> {user?.email}
                </span>
                <span style={{ fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={16} /> Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="card" style={{ padding: 28, background: 'var(--bg-card)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>Security Status</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={24} />
              </div>
              <div>
                <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--text-primary)' }}>Secure & Active</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Verified Email</p>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Profile Completion</p>
            <div className="progress-track" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: user?.avatar_url ? '100%' : '75%' }} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8, fontWeight: 700 }}>
              {user?.avatar_url ? '100%' : '75%'} Complete
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Settings Card */}
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <User size={20} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22 }}>General Settings</h3>
            </div>

            {error && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 20 }}>{error}</div>}
            {success && (
              <div style={{ background: 'var(--accent-light)', color: 'var(--income-color)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={16} /> Settings updated!
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Display Name</label>
                <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Email Address</label>
                <input className="input" type="email" value={user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="submit" className="btn-primary" disabled={saving} style={{ minWidth: 140, justifyContent: 'center' }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Security Card */}
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Lock size={20} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22 }}>Security</h3>
            </div>
            
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Update your account credentials to ensure your financial data remains secure and private.
            </p>

            <div style={{ 
              padding: '24px', borderRadius: 16, border: '1px solid var(--border)', 
              background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: 16
            }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Password Configuration</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last changed: 2 months ago</p>
              </div>
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="btn-ghost" 
                style={{ width: '100%', justifyContent: 'center', gap: 10 }}
              >
                <Shield size={16} />
                Change Password
              </button>
            </div>
          </div>
        </div>

        <MilestonesSection />
      </div>

      {showPasswordModal && <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />}
    </AppShell>
  );
}
