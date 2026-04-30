'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api';
import { X, Lock, Check, ShieldAlert } from 'lucide-react';

export default function PasswordChangeModal({ onClose }) {
  const [form, setForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (form.new_password !== form.confirm_password) {
      return setError('Passwords do not match');
    }
    
    if (form.new_password.length < 6) {
      return setError('New password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await api.changePassword({
        old_password: form.old_password,
        new_password: form.new_password,
      });
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ zIndex: 9999 }}>
      <div className="modal-box" style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20 }}>Change Password</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-light)', 
              color: 'var(--accent)', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', margin: '0 auto 16px' 
            }}>
              <Check size={24} />
            </div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Password Updated!</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Closing modal...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div style={{ 
                background: 'var(--danger-light)', color: 'var(--danger)', 
                borderRadius: 10, padding: '10px 14px', fontSize: 13, 
                display: 'flex', alignItems: 'center', gap: 8 
              }}>
                <ShieldAlert size={16} />
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Current Password
              </label>
              <div style={{ relative: 'true' }}>
                <input 
                  className="input" 
                  type="password" 
                  required 
                  value={form.old_password}
                  onChange={e => setForm(p => ({ ...p, old_password: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                New Password
              </label>
              <input 
                className="input" 
                type="password" 
                required 
                value={form.new_password}
                onChange={e => setForm(p => ({ ...p, new_password: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Confirm New Password
              </label>
              <input 
                className="input" 
                type="password" 
                required 
                value={form.confirm_password}
                onChange={e => setForm(p => ({ ...p, confirm_password: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
