'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="header">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, background: 'var(--color-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 22h20L12 2zm0 4l6.5 14h-13L12 6z" />
            </svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'Space Grotesk, sans-serif' }}>Trick</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {status === 'authenticated' ? (
            <>
              <Link href="/dashboard" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 500 }}>Dashboard</Link>
              <button
                onClick={() => signOut()}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontWeight: 500 }}
              >
                Sign Out
              </button>
              {session?.user?.image ? (
                <img src={session.user.image} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
                  {session?.user?.name?.[0] || '?'}
                </div>
              )}
            </>
          ) : (
            <Link href="/login" className="btn-primary">Sign In</Link>
          )}
        </nav>
      </div>
    </header>
  );
}