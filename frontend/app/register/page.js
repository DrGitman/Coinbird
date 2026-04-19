'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import logoTextBlack from '../../app/assets/images/logo_text_black.png';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard');
  }, [user, authLoading, router]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 py-12" style={{ background: 'linear-gradient(to bottom right, #f2faeb, #defce9)' }}>
      <div className="flex flex-col items-center gap-10 w-full max-w-[460px]">
        {/* Logo */}
        <div className="flex justify-center">
          <Image src={logoTextBlack} alt="Coinbird" height={32} className="object-contain" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_12px_40px_-15px_rgba(40,60,30,0.15)] w-full">
          <div className="mb-6">
            <p style={{ color: '#687e5b', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
              Join the flock
            </p>
            <h1 style={{ fontFamily: 'var(--font-display, "DM Serif Display"), serif', fontSize: '2.5rem', color: '#1e3012', lineHeight: 1.1, marginBottom: 6 }}>
              Cultivate Clarity.
            </h1>
            <p style={{ color: '#4a5d40', fontSize: 14, marginTop: 4 }}>
              Start your journey toward financial flourishing.
            </p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#991b1b', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 16, border: '1px solid #f87171' }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#687e5b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Full Name</label>
              <input 
                suppressHydrationWarning
                type="text" 
                placeholder="Johnathan Appleseed" 
                value={form.name} onChange={e => set('name', e.target.value)} required 
                style={{ width: '100%', background: '#edf4e0', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, color: '#3d522f', outline: 'none' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#687e5b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Email Address</label>
              <input 
                suppressHydrationWarning
                type="email" 
                placeholder="hello@example.com" 
                value={form.email} onChange={e => set('email', e.target.value)} required 
                style={{ width: '100%', background: '#edf4e0', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, color: '#3d522f', outline: 'none' }}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#687e5b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Password</label>
                <div className="relative">
                  <input 
                    suppressHydrationWarning
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={form.password} onChange={e => set('password', e.target.value)} required minLength={6}
                    style={{ width: '100%', background: '#edf4e0', border: 'none', borderRadius: 12, padding: '14px', paddingRight: '46px', fontSize: 15, color: '#3d522f', outline: 'none' }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#687e5b', cursor: 'pointer', display: 'flex' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#687e5b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Confirm</label>
                <div className="relative">
                <input 
                  suppressHydrationWarning
                  type={showConfirm ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={form.confirm} onChange={e => set('confirm', e.target.value)} required minLength={6}
                  style={{ width: '100%', background: '#edf4e0', border: 'none', borderRadius: 12, padding: '14px', paddingRight: '46px', fontSize: 15, color: '#3d522f', outline: 'none' }}
                />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#687e5b', cursor: 'pointer', display: 'flex' }}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                width: '100%', background: '#355627', color: 'white', borderRadius: 40, padding: '16px', 
                fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 8,
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#28421c'}
              onMouseLeave={e => e.currentTarget.style.background = '#355627'}
            >
              {loading ? 'Processing...' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#687e5b' }}>
            Already part of the garden? 
            <button onClick={() => router.push('/login')}
              style={{ color: '#355627', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4 }}>
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
