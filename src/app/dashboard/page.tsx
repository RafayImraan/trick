'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { QRCodeSVG } from 'qrcode.react';

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
  stealthKeyId?: string;
}

interface Transaction {
  id: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  status: string;
  timestamp: string;
}

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<StealthKey[]>([]);
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [withdrawKeyId, setWithdrawKeyId] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'withdrawing' | 'success' | 'error'>('idle');
  const [withdrawError, setWithdrawError] = useState('');

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [keysRes, linksRes, txRes, balanceRes] = await Promise.all([
        fetch('/api/keys'),
        fetch('/api/links'),
        fetch('/api/transactions'),
        fetch('/api/balance', { method: 'POST' })
      ]);
      const keysData = await keysRes.json();
      const linksData = await linksRes.json();
      const txData = await txRes.json();
      const balanceData = await balanceRes.json();
      setKeys(keysData.keys || []);
      setLinks(linksData.links || []);
      setTransactions(txData.transactions || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setKeys([]);
      setLinks([]);
      setTransactions([]);
    }
  };

  const syncBalances = async () => {
    setSyncing(true);
    try {
      await fetch('/api/balance', { method: 'POST' });
      await fetchData();
    } catch (error) {
      console.error('Failed to sync balances:', error);
    } finally {
      setSyncing(false);
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

  const getShareUrl = (linkCode: string) => `${window.location.origin}/pay/${linkCode}`;

  const copyLink = (linkId: string, linkCode: string) => {
    const link = getShareUrl(linkCode);
    navigator.clipboard.writeText(link);
    setCopiedLinkId(linkId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const shareToTelegram = (linkCode: string) => {
    const url = getShareUrl(linkCode);
    const text = `Send me crypto privately using this link: ${url}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareToTwitter = (linkCode: string) => {
    const url = getShareUrl(linkCode);
    const text = `Send me crypto privately! ${url}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareToWhatsApp = (linkCode: string) => {
    const url = getShareUrl(linkCode);
    const text = `Send me crypto privately using this link: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleWithdraw = async () => {
    if (!withdrawKeyId || !withdrawAmount || !withdrawAddress) return;

    setWithdrawStatus('withdrawing');
    setWithdrawError('');

    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stealthKeyId: withdrawKeyId,
          toAddress: withdrawAddress,
          amount: withdrawAmount,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setWithdrawError(data.error || 'Withdrawal failed');
        setWithdrawStatus('error');
        return;
      }

      setWithdrawStatus('success');
      setWithdrawAmount('');
      setWithdrawAddress('');
      setWithdrawKeyId(null);
      fetchData();
    } catch (error) {
      setWithdrawError('Withdrawal failed');
      setWithdrawStatus('error');
    }
  };

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  if (sessionStatus === 'loading') {
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
  const keysWithFunds = keys.filter(k => parseFloat(k.balance || '0') > 0);

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
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={syncBalances} className="btn-secondary" disabled={syncing} style={{ padding: '16px 22px' }}>
                {syncing ? 'Syncing...' : 'Sync Balance'}
              </button>
              <button onClick={generateLink} className="btn-primary" style={{ padding: '16px 22px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                New Payment Link
              </button>
            </div>
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

          {withdrawKeyId && (
            <section className="panel" style={{ marginBottom: 22, padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>Withdraw Funds</h3>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Amount (TRX)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="input-field"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>To Address</label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="T..."
                    className="input-field"
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawStatus === 'withdrawing' || !withdrawAmount || !withdrawAddress}
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    {withdrawStatus === 'withdrawing' ? 'Withdrawing...' : 'Withdraw'}
                  </button>
                  <button onClick={() => setWithdrawKeyId(null)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
                {withdrawError && (
                  <p style={{ color: 'var(--color-primary)' }}>{withdrawError}</p>
                )}
                {withdrawStatus === 'success' && (
                  <p style={{ color: 'var(--color-success)' }}>Withdrawal successful!</p>
                )}
              </div>
            </section>
          )}

          <section className="dashboard-grid">
            <div className="panel dashboard-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <h2 style={{ fontSize: 28, marginBottom: 6 }}>Payment Links</h2>
                  <p className="muted">Generate, copy, and share links to receive crypto.</p>
                </div>
                <span className="pill pill-danger">{links.length} active</span>
              </div>

              {links.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 20 }}>
                  <h3 style={{ fontSize: 22, marginBottom: 8 }}>No payment links yet</h3>
                  <p className="muted">Create your first route to start collecting private payments.</p>
                </div>
              ) : (
                <div className="list-stack">
                  {links.map((link) => (
                    <div key={link.id} className="link-item">
                      <div style={{ flex: 1 }}>
                        <code className="mono" style={{ display: 'block', marginBottom: 4 }}>
                          {formatAddress(link.linkCode)}
                        </code>
                        <p className="muted" style={{ fontSize: 14 }}>Clicks: {link.clickCount}</p>
                      </div>
                      <div className="link-actions">
                        <button onClick={() => copyLink(link.id, link.linkCode)} className="btn-secondary btn-sm">
                          {copiedLinkId === link.id ? 'Copied!' : 'Copy'}
                        </button>
                        <button onClick={() => setShowQR(showQR === link.id ? null : link.id)} className="btn-secondary btn-sm">
                          {showQR === link.id ? 'Hide QR' : 'QR'}
                        </button>
                        <button onClick={() => shareToTelegram(link.linkCode)} className="btn-secondary btn-sm" title="Share to Telegram">
                          TG
                        </button>
                        <button onClick={() => shareToTwitter(link.linkCode)} className="btn-secondary btn-sm" title="Share to Twitter">
                          X
                        </button>
                        <button onClick={() => shareToWhatsApp(link.linkCode)} className="btn-secondary btn-sm" title="Share to WhatsApp">
                          WA
                        </button>
                      </div>
                      {showQR === link.id && (
                        <div style={{ marginTop: 16, textAlign: 'center' }}>
                          <div style={{ padding: 16, background: 'white', borderRadius: 12, display: 'inline-block' }}>
                            <QRCodeSVG value={getShareUrl(link.linkCode)} size={180} level="M" />
                          </div>
                          <p className="muted" style={{ marginTop: 12, fontSize: 12 }}>{getShareUrl(link.linkCode)}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel dashboard-panel">
              <div style={{ marginBottom: 8 }}>
                <h2 style={{ fontSize: 28, marginBottom: 6 }}>Stealth Addresses</h2>
                <p className="muted">Your private receive addresses with funds.</p>
              </div>

              {keys.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 20 }}>
                  <h3 style={{ fontSize: 22, marginBottom: 8 }}>No addresses yet</h3>
                  <p className="muted">A stealth address will appear once someone sends funds to your link.</p>
                </div>
              ) : (
                <div className="list-stack">
                  {keys.map((key) => (
                    <div key={key.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <code className="mono" style={{ fontSize: 12, display: 'block', marginBottom: 8, wordBreak: 'break-all' }}>
                          {key.address}
                        </code>
                        <p className="muted" style={{ fontSize: 14 }}>
                          Created: {new Date(key.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="pill pill-success" style={{ marginBottom: 8 }}>
                          {parseFloat(key.balance || '0').toFixed(2)} TRX
                        </div>
                        {parseFloat(key.balance || '0') > 0 && (
                          <button onClick={() => setWithdrawKeyId(key.id)} className="btn-secondary btn-sm">
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="panel" style={{ marginTop: 22, padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Recent Transactions</h3>
            {transactions.length === 0 ? (
              <p className="muted">No transactions yet.</p>
            ) : (
              <div className="list-stack">
                {transactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="list-item">
                    <div>
                      <code className="mono" style={{ fontSize: 12, wordBreak: 'break-all' }}>{tx.txHash}</code>
                      <p className="muted" style={{ fontSize: 12 }}>
                        {tx.fromAddress ? formatAddress(tx.fromAddress) : 'external'} → {formatAddress(tx.toAddress)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="pill pill-success">+{parseFloat(tx.amount).toFixed(2)} TRX</div>
                      <p className="muted" style={{ fontSize: 12 }}>{new Date(tx.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}