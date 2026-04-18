import { Header } from '@/components/Header';
import { LoginActions } from '@/components/LoginActions';

export default function LoginPage() {
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const appleEnabled = Boolean(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET);

  return (
    <>
      <Header />
      <main style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>Welcome to Trick</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32 }}>Sign in to get started</p>

          <LoginActions googleEnabled={googleEnabled} appleEnabled={appleEnabled} />

          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--color-text-secondary)' }}>
            By signing in, you agree to our Terms of Service
          </p>
        </div>
      </main>
    </>
  );
}
