import Link from 'next/link';
import { Header } from '@/components/Header';

export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-pattern">
        <section className="section" style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center' }}>
          <div className="container">
            <div className="hero-shell">
              <div className="hero-copy fade-in">
                <div className="eyebrow">
                  <span className="eyebrow-dot" />
                  Now live on TRON
                </div>
                <h1>
                  Send crypto like a link.
                  <span className="text-gradient"> Stay private by default.</span>
                </h1>
                <p>
                  Trick turns crypto payouts into something shareable, human, and fast. No address handling.
                  No wallet support threads. Just payment links backed by stealth receive infrastructure.
                </p>

                <div className="hero-actions">
                  <Link href="/login" className="btn-primary" style={{ fontSize: 18, padding: '16px 30px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    Get Started
                  </Link>
                  <Link href="#how-it-works" className="btn-secondary" style={{ fontSize: 18, padding: '16px 30px' }}>
                    Learn More
                  </Link>
                </div>

                <div className="hero-meta">
                  <div className="metric-card">
                    <strong>Private by design</strong>
                    <span>Each payment route can resolve to a fresh stealth address.</span>
                  </div>
                  <div className="metric-card">
                    <strong>Web2 entrypoint</strong>
                    <span>Google login removes wallet onboarding friction.</span>
                  </div>
                  <div className="metric-card">
                    <strong>Share anywhere</strong>
                    <span>Payment links are ready for chat, socials, or invoices.</span>
                  </div>
                </div>
              </div>

              <div className="panel hero-card slide-up">
                <div className="hero-card-grid">
                  <div className="hero-spotlight">
                    <small style={{ display: 'block', marginBottom: 10, fontWeight: 700, letterSpacing: '0.02em' }}>
                      PAYMENT FLOW SNAPSHOT
                    </small>
                    <h3 style={{ fontSize: 32, marginBottom: 10 }}>From link to payment in three moves.</h3>
                    <p style={{ lineHeight: 1.7 }}>
                      Sign in, generate a shareable route, and let Trick handle the private receive layer under the hood.
                    </p>
                  </div>

                  <div className="stack-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <strong style={{ fontSize: 18 }}>Why teams use it</strong>
                      <span className="pill pill-success">Live flow</span>
                    </div>
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                        <span className="muted">No exposed treasury address</span>
                        <strong>Hidden</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                        <span className="muted">Recipient experience</span>
                        <strong>Link-based</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                        <span className="muted">Onboarding time</span>
                        <strong>Under a minute</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="stack-card">
                      <div className="pill pill-danger" style={{ marginBottom: 12, width: 'fit-content' }}>01</div>
                      <h3 style={{ fontSize: 19, marginBottom: 8 }}>Generate link</h3>
                      <p className="muted">Create a payment route from the dashboard with one click.</p>
                    </div>
                    <div className="stack-card">
                      <div className="pill pill-danger" style={{ marginBottom: 12, width: 'fit-content' }}>02</div>
                      <h3 style={{ fontSize: 19, marginBottom: 8 }}>Receive privately</h3>
                      <p className="muted">Funds arrive through stealth-aware infrastructure, not public reuse.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <div className="container">
            <div className="section-heading">
              <h2>Built for payments that should feel simple, not risky.</h2>
              <p>
                The product works because the interface stays familiar while the infrastructure stays opinionated.
                These are the three reasons the experience feels lighter than a typical crypto tool.
              </p>
            </div>

            <div className="feature-grid">
              <div className="glass-card feature-card">
                <div className="icon-badge">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-primary)">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 24, marginBottom: 10 }}>Privacy first</h3>
                <p>Each payment generates a new stealth address. Your main wallet stays hidden.</p>
              </div>

              <div className="glass-card feature-card">
                <div className="icon-badge">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-primary)">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 24, marginBottom: 10 }}>One-click sharing</h3>
                <p>Generate a payment link and share via Telegram, Twitter, or anywhere.</p>
              </div>

              <div className="glass-card feature-card">
                <div className="icon-badge">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-primary)">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 24, marginBottom: 10 }}>Web2 simplicity</h3>
                <p>Sign in with Google. No seed phrases. No wallet setup friction.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section">
          <div className="container">
            <div className="section-heading">
              <h2>How it works</h2>
              <p>
                The product journey is intentionally short: authenticate once, create a payment route, and track incoming value without exposing the wrong address.
              </p>
            </div>

            <div className="step-grid">
              <div className="glass-card step-card">
                <div className="step-number">1</div>
                <h3 style={{ fontSize: 26, marginBottom: 10 }}>Sign in</h3>
                <p>Connect with Google and skip the usual wallet-installation explanation loop.</p>
              </div>
              <div className="glass-card step-card">
                <div className="step-number">2</div>
                <h3 style={{ fontSize: 26, marginBottom: 10 }}>Create a link</h3>
                <p>Generate a route from your dashboard and share it anywhere your customer already is.</p>
              </div>
              <div className="glass-card step-card">
                <div className="step-number">3</div>
                <h3 style={{ fontSize: 26, marginBottom: 10 }}>Track receipts</h3>
                <p>Payments resolve privately while your dashboard stays readable and operationally clean.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="footer-shell">
          <div className="container panel panel-tint" style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
            <p>&copy; 2026 Trick. Built on TRON.</p>
            <p>Private payment links for operators who want less friction and more control.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
