'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import Image from 'next/image';
import logoSquare from '../app/assets/images/logo.png';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/dashboard' : '/login');
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: 'transparent' }}><Image src={logoSquare} width={40} height={40} className="object-contain" alt="Coinbird" /></div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Preparing your budget…</p>
      </div>
    </div>
  );
}
