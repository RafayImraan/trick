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
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

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
      const [keysRes, linksRes] = await Promise.all([fetch('/api/keys'), fetch('/api/links')]);
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
        setLinks((currentLinks) => [...currentLinks, data.link]);
      }
    } catch (error) {
      console.error('Failed to generate link:', error);
    }
  };

  const copyLink = (linkId: string, linkCode: string) => {
    const link = `${window.location.origin}/pay/${linkCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLinkId(linkId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  if (status === 'loading') {
    return (
      <>
        <Header />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="panel" style={{ padding: 28 }}>Loading...</div>
        </main>
      </>
    );
  }

  const totalBalance = keys.reduce((acc, k) => acc + parseFloat(k.balance || '0'), 0);
  const totalClicks = links.reduce((acc, link) => acc + link.clickCount, 0);

  return (
    <>
      <Header />
      <main className="bg-pattern dashboard-shell">
        <div className="container">
          <div className="dashboard-top fade-in">
            <div>
              <div className="pill pill-danger" style={{ marginBottom: 14, width: 'fit-content' }}>
                Operations Hub
              </div>
              <h1>Dashboard</h1>
              <p>Welcome back, {session?.user?.name || 'User'}</p>
            </div>
            <button onClick={generateLink} className="btn-primary" style={{ padding: '16px 22px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              New Payment Link
            </button>
          </div>

          <section className="dashboard-stats slide-up">
            <div className="panel dashboard-balance">
              <div>
                <div className="pill pill-success" style={{ width: 'fit-content', marginBottom: 18 }}>Live Balance</div>
                <h2 style={{ fontSize: 22, marginBottom: 18 }}>Total Balance</h2>
                <div className="dashboard-balance-value">{totalBalance.toFixed(2)} TRX</div>
              </div>
              <div>
                <p className="muted" style={{ marginBottom: 10 }}>Approximate fiat value</p>
                <strong style={{ fontSize: 24, fontFamily: 'Space Grotesk, sans-serif' }}>
                  ~${(totalBalance * 0.25).toFixed(2)} USD
                </strong>
              </div>
            </div>

            <div className="panel stat-tile">
              <span className="muted">Payment links</span>
              <strong>{links.length}</strong>
              <p className="muted">Ready-to-share routes created from your account.</p>
            </div>

            <div className="panel stat-tile">
              <span className="muted">Stealth addresses</span>
              <strong>{keys.length}</strong>
              <p className="muted">Private receive endpoints currently provisioned.</p>
            </div>

            <div className="panel stat-tile">
              <span className="muted">Total clicks tracked</span>
              <strong>{totalClicks}</strong>
              <p className="muted">Interaction count across all active payment links.</p>
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="panel dashboard-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <h2 style={{ fontSize: 28, marginBottom: 6 }}>Payment Links</h2>
                  <p className="muted">Generate, copy, and monitor the routes recipients will use.</p>
                </div>
                <span className="pill pill-danger">{links.length} active</span>
              </div>

              {links.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 20 }}>
                  <h3 style={{ fontSize: 22, marginBottom: 8 }}>No payment links yet</h3>
                  <p className="muted">Create your first route to start collecting private payments through a shareable URL.</p>
                </div>
              ) : (
                <div className="list-stack">
                  {links.map((link) => (
                    <div key={link.id} className="list-item">
                      <div>
                        <code className="mono" style={{ display: 'block', marginBottom: 8 }}>
                          {formatAddress(link.linkCode)}
                        </code>
                        <p className="muted" style={{ fontSize: 14 }}>Clicks tracked: {link.clickCount}</p>
                      </div>
                      <button
                        onClick={() => copyLink(link.id, link.linkCode)}
                        className="btn-secondary"
                        style={{ padding: '10px 14px', minWidth: 120 }}
                      >
                        {copiedLinkId === link.id ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel dashboard-panel">
              <div style={{ marginBottom: 8 }}>
                <h2 style={{ fontSize: 28, marginBottom: 6 }}>Stealth Addresses</h2>
                <p className="muted">Addresses generated behind the scenes for more private receipt handling.</p>
              </div>

              {keys.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 20 }}>
                  <h3 style={{ fontSize: 22, marginBottom: 8 }}>No addresses yet</h3>
                  <p className="muted">A stealth address will appear once the system provisions one for incoming payment flow.</p>
                </div>
              ) : (
                <div className="list-stack">
                  {keys.map((key) => (
                    <div key={key.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                      <div>
                        <code className="mono" style={{ fontSize: 12, display: 'block', marginBottom: 8, wordBreak: 'break-all' }}>
                          {key.address}
                        </code>
                        <p className="muted" style={{ fontSize: 14 }}>
                          Created: {new Date(key.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="pill pill-success">
                        {parseFloat(key.balance || '0').toFixed(2)} TRX
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
