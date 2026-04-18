'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';

interface StealthKey {
  id: string;
  address: string;
  balance: string;
  createdAt: string;
}

interface PaymentLink {
  id: string;
  linkCode: string;
  createdAt: string;
  clickCount: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<StealthKey[]>([]);
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [keysRes, linksRes] = await Promise.all([
        fetch('/api/keys'),
        fetch('/api/links'),
      ]);
      const keysData = await keysRes.json();
      const linksData = await linksRes.json();
      setKeys(keysData.keys || []);
      setLinks(linksData.links || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const generateLink = async () => {
    try {
      const res = await fetch('/api/links', { method: 'POST' });
      const data = await res.json();
      if (data.link) {
        setLinks([...links, data.link]);
      }
    } catch (error) {
      console.error('Failed to generate link:', error);
    }
  };

  const copyLink = (linkCode: string) => {
    const link = `${window.location.origin}/pay/${linkCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (status === 'loading') {
    return (
      <>
        <Header />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading...</div>
        </main>
      </>
    );
  }

  const totalBalance = keys.reduce((acc, k) => acc + parseFloat(k.balance || '0'), 0);

  return (
    <>
      <Header />
      <main className="bg-pattern" style={{ minHeight: 'calc(100vh - 64px)', padding: '32px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 32, marginBottom: 4 }}>Dashboard</h1>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Welcome back, {session?.user?.name || 'User'}
              </p>
            </div>
            <button onClick={generateLink} className="btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              New Payment Link
            </button>
          </div>

          <div className="glass-card" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>Total Balance</h2>
            <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--color-primary)' }}>
              {totalBalance.toFixed(2)} TRX
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>
              ~${(totalBalance * 0.25).toFixed(2)} USD
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
            <div className="glass-card">
              <h2 style={{ fontSize: 20, marginBottom: 16 }}>Payment Links</h2>
              {links.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)' }}>No payment links yet. Create one to get started.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {links.map((link) => (
                    <div
                      key={link.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 12,
                        background: 'var(--color-bg-light)',
                        borderRadius: 8,
                      }}
                    >
                      <code className="mono" style={{ fontSize: 12 }}>
                        {formatAddress(link.linkCode)}
                      </code>
                      <button
                        onClick={() => copyLink(link.linkCode)}
                        className="btn-secondary"
                        style={{ padding: '8px 12px', fontSize: 12 }}
                      >
                        {copied ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card">
              <h2 style={{ fontSize: 20, marginBottom: 16 }}>Stealth Addresses</h2>
              {keys.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)' }}>No addresses yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {keys.map((key) => (
                    <div
                      key={key.id}
                      style={{
                        padding: 12,
                        background: 'var(--color-bg-light)',
                        borderRadius: 8,
                      }}
                    >
                      <code className="mono" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        {key.address}
                      </code>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          Balance: {parseFloat(key.balance || '0').toFixed(2)} TRX
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}