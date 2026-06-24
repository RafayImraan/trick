'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';

interface Transaction {
  id: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  status: string;
  timestamp: string;
}

export default function TransactionsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchTransactions();
    }
  }, [session]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    }
  };

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
  };

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

  return (
    <>
      <Header />
      <main className="bg-pattern" style={{ minHeight: '100vh' }}>
        <div className="container" style={{ paddingTop: 40 }}>
          <div className="fade-in" style={{ marginBottom: 32 }}>
            <div className="pill pill-danger" style={{ marginBottom: 14, width: 'fit-content' }}>
              History
            </div>
            <h1>Transactions</h1>
            <p className="muted">All incoming payments to your stealth addresses.</p>
          </div>

          <section className="panel slide-up" style={{ padding: 24 }}>
            {transactions.length === 0 ? (
              <div className="empty-state">
                <h3 style={{ fontSize: 22, marginBottom: 8 }}>No transactions yet</h3>
                <p className="muted">Share a payment link to start receiving crypto.</p>
              </div>
            ) : (
              <div className="list-stack">
                {transactions.map((tx) => (
                  <div key={tx.id} className="list-item">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <code className="mono" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                          {tx.txHash}
                        </code>
                        <button
                          onClick={() => copyHash(tx.txHash)}
                          className="btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: 11, flexShrink: 0 }}
                          title="Copy transaction hash"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="muted" style={{ fontSize: 12 }}>
                        {tx.fromAddress ? formatAddress(tx.fromAddress) : 'external'} → {formatAddress(tx.toAddress)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="pill pill-success" style={{ marginBottom: 4 }}>
                        +{parseFloat(tx.amount).toFixed(2)} TRX
                      </div>
                      <p className="muted" style={{ fontSize: 12 }}>
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </p>
                      <p style={{ fontSize: 11, color: tx.status === 'confirmed' ? 'var(--color-success)' : 'var(--color-primary)' }}>
                        {tx.status}
                      </p>
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
