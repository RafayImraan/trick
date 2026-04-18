import Link from 'next/link';
import { Header } from '@/components/Header';

export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-pattern">
        <section className="section" style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center' }}>
          <div className="container">
            <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
              <div style={{ marginBottom: 16 }}>
                <span className="success-badge">Now Live on TRON</span>
              </div>
              <h1 style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1, marginBottom: 24, color: 'var(--color-text)' }}>
                Send crypto like a link.{' '}
                <span className="text-gradient">Stay private by default.</span>
              </h1>
              <p style={{ fontSize: 20, color: 'var(--color-text-secondary)', marginBottom: 40, lineHeight: 1.6 }}>
                Trick transforms crypto payments into shareable links.
                No wallet addresses. No copy-paste. Just simple, private transfers.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/login" className="btn-primary" style={{ fontSize: 18, padding: '16px 32px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  Get Started
                </Link>
                <Link href="#how-it-works" className="btn-secondary" style={{ fontSize: 18, padding: '16px 32px' }}>
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section" style={{ background: 'var(--color-bg-light)' }}>
          <div className="container">
            <h2 style={{ fontSize: 36, textAlign: 'center', marginBottom: 48 }}>Why Trick?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              <div className="glass-card">
                <div style={{ width: 48, height: 48, background: 'rgba(255,51,51,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-primary)">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>Privacy First</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  Each payment generates a new stealth address. Your main wallet stays hidden.
                </p>
              </div>

              <div className="glass-card">
                <div style={{ width: 48, height: 48, background: 'rgba(255,51,51,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-primary)">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>One-Click Sharing</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  Generate a payment link and share via Telegram, Twitter, or anywhere.
                </p>
              </div>

              <div className="glass-card">
                <div style={{ width: 48, height: 48, background: 'rgba(255,51,51,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-primary)">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>Web2 Simplicity</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  Sign in with Google. No seed phrases. No wallet setup friction.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section">
          <div className="container">
            <h2 style={{ fontSize: 36, textAlign: 'center', marginBottom: 48 }}>How It Works</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, textAlign: 'center' }}>
              <div>
                <div style={{ width: 64, height: 64, background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, fontWeight: 700, color: 'white' }}>1</div>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>Sign In</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>Connect your Google or Apple account. No crypto expertise needed.</p>
              </div>
              <div>
                <div style={{ width: 64, height: 64, background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, fontWeight: 700, color: 'white' }}>2</div>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>Share Link</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>Get your unique payment link and share it anywhere you want.</p>
              </div>
              <div>
                <div style={{ width: 64, height: 64, background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, fontWeight: 700, color: 'white' }}>3</div>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>Get Paid</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>Receive funds privately. View all payments in your dashboard.</p>
              </div>
            </div>
          </div>
        </section>

        <footer style={{ background: 'var(--color-bg-light)', padding: '32px 0', borderTop: '1px solid var(--color-border)' }}>
          <div className="container" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <p>&copy; 2026 Trick. Built on TRON.</p>
          </div>
        </footer>
      </main>
    </>
  );
}