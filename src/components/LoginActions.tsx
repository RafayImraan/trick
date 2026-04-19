'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    tronWeb?: any;
    tronLink?: any;
  }
}

export function LoginActions() {
  const [connecting, setConnecting] = useState(false);
  const router = useRouter();

  const connectWallet = async () => {
    setConnecting(true);
    try {
      if (window.tronLink && window.tronLink.request) {
        await window.tronLink.request({ method: 'tron_requestAccounts' });
      } else if (window.tronWeb) {
        await window.tronWeb.trx.request({ method: 'tron_requestAccounts' });
      }
      
      const address = window.tronWeb?.defaultAddress?.base58 || window.tronLink?.tronWeb?.defaultAddress?.base58;
      
      if (address) {
        await signIn('credentials', { 
          callbackUrl: '/dashboard',
          walletAddress: address 
        });
      } else {
        alert('Could not get wallet address. Please try again.');
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button
        onClick={connectWallet}
        disabled={connecting}
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', gap: 12, minHeight: 58 }}
      >
        {connecting ? (
          <span>Connecting...</span>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Connect Wallet
          </>
        )}
      </button>
    </div>
  );
}