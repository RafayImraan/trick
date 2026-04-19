'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type TronWeb = {
  ready?: boolean;
  defaultAddress?: { base58: string } | undefined;
  trx?: {
    sendTransaction?: (to: string, amount: number) => Promise<{ txid: string }>;
    getBalance?: (address: string) => Promise<number>;
    request?: (options: { method: string }) => Promise<void>;
  };
  requestAccount?: () => void;
};

type TronWindow = {
  tronWeb?: TronWeb;
  tronLink?: {
    request?: (options: { method: string }) => Promise<void>;
    tronWeb?: TronWeb;
  };
};

declare global {
  interface Window extends TronWindow {}
}

export default function PayPage() {
  const params = useParams();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [balance, setBalance] = useState(0);
  const [receiverAddress, setReceiverAddress] = useState('');

  const linkId = params.id as string;
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const urlAmount = searchParams.get('amount');

  useEffect(() => {
    checkWallet();
    fetchReceiver();
    if (urlAmount) {
      setAmount(urlAmount);
    }
  }, []);

  const checkWallet = async () => {
    setStatus('connecting');
    try {
      const tron = (window.tronWeb || window.tronLink?.tronWeb) as TronWeb | undefined;
      if (tron?.ready && tron.defaultAddress?.base58 && tron.trx?.getBalance) {
        setWalletConnected(true);
        const addr = tron.defaultAddress.base58;
        const bal = await tron.trx.getBalance(addr);
        setBalance(bal / 1e6);
        setStatus('idle');
        return;
      }
      setStatus('idle');
    } catch (err) {
      console.error('Wallet error:', err);
      setStatus('idle');
    }
  };

  const fetchReceiver = async () => {
    try {
      const res = await fetch(`/api/pay/${linkId}`);
      const data = await res.json();
      if (data.address) {
        setReceiverAddress(data.address);
      }
    } catch (err) {
      console.error('Failed to fetch receiver:', err);
    }
  };

  const sendPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const tron = (window.tronWeb || window.tronLink?.tronWeb) as TronWeb | undefined;
    if (!tron?.ready || !tron.defaultAddress?.base58 || !tron.trx?.sendTransaction) {
      setError('Please connect TronLink wallet');
      return;
    }

    setStatus('sending');
    setError('');

    try {
      const amountSun = Math.floor(parseFloat(amount) * 1e6);

      const result = await tron.trx.sendTransaction(receiverAddress, amountSun);

      setTxHash(result.txid);
      setStatus('success');

      await fetch(`/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId,
          txHash: result.txid,
          amount: amount,
          toAddress: receiverAddress,
        }),
      });
    } catch (err: unknown) {
      console.error('Send error:', err);
      setError(err instanceof Error ? err.message : 'Transaction failed');
      setStatus('error');
    }
  };

  const connectWallet = async () => {
    if (window.tronLink?.request) {
      await window.tronLink.request({ method: 'tron_requestAccounts' });
    } else if (window.tronWeb?.trx?.request) {
      await window.tronWeb.trx.request({ method: 'tron_requestAccounts' });
    } else {
      setError('Please install TronLink Wallet');
    }
    setTimeout(checkWallet, 1000);
  };

  if (status === 'success') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-light)' }}>
        <div className="glass-card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: 'var(--color-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Payment Sent!</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            {amount} TRX sent successfully
          </p>
          <code className="mono" style={{ fontSize: 12, wordBreak: 'break-all', display: 'block', marginBottom: 16 }}>
            {txHash}
          </code>
          <Link href="/" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-pattern" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ maxWidth: 400, width: '100%' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8, textAlign: 'center' }}>Send Payment</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, textAlign: 'center' }}>
          Sending crypto privately
        </p>

        {walletConnected ? (
          <>
            <div style={{ marginBottom: 16, padding: 12, background: 'var(--color-bg-light)', borderRadius: 8 }}>
              <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Your Balance</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>
                {balance.toFixed(2)} TRX
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Amount (TRX)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input-field"
                step="0.01"
                min="0"
              />
            </div>

            <button
              onClick={sendPayment}
              disabled={status === 'sending'}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', opacity: status === 'sending' ? 0.7 : 1 }}
            >
              {status === 'sending' ? 'Sending...' : 'Send Payment'}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: 16, color: 'var(--color-text-secondary)' }}>
              Connect your TronLink wallet to send payment
            </p>
            <button onClick={connectWallet} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Connect Wallet
            </button>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(255,51,51,0.1)', borderRadius: 8, color: 'var(--color-primary)' }}>
            {error}
          </div>
        )}
      </div>
    </main>
  );
}