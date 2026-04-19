import { Header } from '@/components/Header';
import { LoginActions } from '@/components/LoginActions';

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="bg-pattern">
        <div className="container login-shell">
          <section className="login-copy fade-in">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              Passwordless onboarding for private TRON payments
            </div>
            <h1>
              Ship payment links in minutes,
              <span className="text-gradient"> not wallet tutorials.</span>
            </h1>
            <p className="muted" style={{ fontSize: '1.08rem', maxWidth: 540 }}>
              Trick keeps the sign-in flow familiar while the payment layer stays privacy-first.
              Your recipients get a link. Your treasury gets a cleaner operational workflow.
            </p>

            <div className="hero-meta" style={{ marginTop: 30 }}>
              <div className="metric-card">
                <strong>1 click</strong>
                <span>Connect wallet without seed phrases</span>
              </div>
              <div className="metric-card">
                <strong>Stealth</strong>
                <span>Fresh receive addresses per payment</span>
              </div>
              <div className="metric-card">
                <strong>TRON-native</strong>
                <span>Built for creators, teams, and merchants</span>
              </div>
            </div>
          </section>

          <section className="panel panel-tint login-card slide-up" style={{ maxWidth: 480, width: '100%', marginLeft: 'auto' }}>
            <div className="pill pill-danger" style={{ marginBottom: 18, width: 'fit-content' }}>
              Secure Access
            </div>
            <h2 style={{ fontSize: 36, marginBottom: 8 }}>Welcome to Trick</h2>
            <p className="muted" style={{ marginBottom: 28 }}>
              Sign in to create private payment links, monitor activity, and manage stealth addresses from one place.
            </p>

            <LoginActions />

            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(22, 21, 28, 0.08)' }}>
              <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', lineHeight: 1.6 }}>
                By signing in, you agree to our Terms of Service and allow Trick to create payment infrastructure tied to your account.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
