'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import logoTextBlack from '../../app/assets/images/logo_text_black.png';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard');
  }, [user, authLoading, router]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
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
              Welcome back
            </p>
            <h1 style={{ fontFamily: 'var(--font-display, "DM Serif Display"), serif', fontSize: '2.5rem', color: '#1e3012', lineHeight: 1.1, marginBottom: 0 }}>
              Welcome home.
            </h1>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#991b1b', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 16, border: '1px solid #f87171' }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-4">
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

            <div>
              <div className="flex justify-between items-center mb-1">
                <label style={{ fontSize: 11, fontWeight: 700, color: '#687e5b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Password</label>
                <button suppressHydrationWarning type="button" style={{ fontSize: 11, fontWeight: 700, color: '#687e5b', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'none' }}>Forgot Password?</button>
              </div>
                <div className="relative">
                  <input 
                    suppressHydrationWarning
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={form.password} onChange={e => set('password', e.target.value)} required minLength={6}
                    style={{ width: '100%', background: '#edf4e0', border: 'none', borderRadius: 12, padding: '14px', paddingRight: '46px', fontSize: 15, color: '#3d522f', outline: 'none' }}
                  />
                <button suppressHydrationWarning type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#687e5b', cursor: 'pointer', display: 'flex' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              suppressHydrationWarning
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
              {loading ? 'Processing...' : 'Login'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#687e5b' }}>
            New to the nest? 
            <button suppressHydrationWarning onClick={() => router.push('/register')}
              style={{ color: '#355627', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4 }}>
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
