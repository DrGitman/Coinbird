'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import Image from 'next/image';
import logoSquare from '../../app/assets/images/logo.png';

import { LayoutDashboard, ArrowUpDown, Target, BarChart2, LogOut, Sprout } from 'lucide-react';

const NAV = [
  { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { href: '/transactions', icon: <ArrowUpDown size={18} />, label: 'Transactions' },
  { href: '/budget', icon: <Target size={18} />, label: 'Budget' },
  { href: '/reports', icon: <BarChart2 size={18} />, label: 'Reports' },
];

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          transition-transform duration-300
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: 220,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '28px 20px 24px' }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Image src={logoSquare} alt="Coinbird" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <p style={{ fontFamily: 'DM Serif Display, serif', fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                Coinbird
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Budget Planner
              </p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ href, icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`} onClick={onClose}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user + add */}
        <div style={{ padding: '16px 12px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link href="/transactions?add=1"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '12px 0', borderRadius: 12,
              background: 'var(--accent)', color: 'white',
              fontWeight: 600, fontSize: 14, textDecoration: 'none',
              transition: 'filter 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.currentTarget.style.filter = ''}
          >
            + Add Transaction
          </Link>

          <button 
            onClick={handleLogout}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', 
              padding: '12px 14px', borderRadius: 12, 
              background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', 
              border: '1px solid rgba(239, 68, 68, 0.1)', cursor: 'pointer',
              fontWeight: 600, fontSize: 13, transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.1)';
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
