'use client';

import Link from 'next/link';
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';

export function Header() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div className="brand-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 22h20L12 2zm0 4l6.5 14h-13L12 6z" />
            </svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.04em' }}>
            Trick
          </span>
        </Link>

        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
        </button>

        <nav className={`header-nav ${menuOpen ? 'header-nav--open' : ''}`}>
          {status === 'authenticated' ? (
            <>
              <Link href="/dashboard" className="header-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link href="/transactions" className="header-link" onClick={() => setMenuOpen(false)}>Transactions</Link>
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="header-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Sign Out
              </button>
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt=""
                  width={38}
                  height={38}
                  style={{
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.95)',
                    boxShadow: '0 10px 20px rgba(22, 21, 28, 0.1)',
                  }}
                />
              ) : (
                <div
                  className="header-avatar"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, #8f39d6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    boxShadow: '0 12px 24px rgba(143, 57, 214, 0.18)',
                  }}
                >
                  {session?.user?.name?.[0] || '?'}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/#features" className="header-link" onClick={() => setMenuOpen(false)}>Features</Link>
              <Link href="/login" className="btn-primary" onClick={() => setMenuOpen(false)}>Sign In</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
