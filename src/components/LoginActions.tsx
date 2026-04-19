'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

declare global {
  interface Window {
    tronLink?: {
      request: (options: { method: string }) => Promise<void>;
      tronWeb?: {
        defaultAddress?: {
          base58: string;
        };
      };
    };
    tronWeb?: {
      defaultAddress?: {
        base58: string;
      };
      trx?: {
        request: (options: { method: string }) => Promise<void>;
      };
    };
  }
}

interface LoginActionsProps {
  googleEnabled: boolean;
  appleEnabled: boolean;
}

export function LoginActions({ googleEnabled, appleEnabled }: LoginActionsProps) {
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    setConnecting(true);
    try {
      if (window.tronLink && window.tronLink.request) {
        await window.tronLink.request({ method: 'tron_requestAccounts' });
      } else if (window.tronWeb?.trx?.request) {
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
      alert('Failed to connect wallet. Make sure TronLink is installed.');
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
              <path d="M3 12l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Connect Wallet
          </>
        )}
      </button>

      {(googleEnabled || appleEnabled) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(22, 21, 28, 0.08)' }} />
          <span style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(22, 21, 28, 0.08)' }} />
        </div>
      )}

      {googleEnabled && (
        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', gap: 12, minHeight: 58 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.45 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      )}

      {appleEnabled && (
        <button
          onClick={() => signIn('apple', { callbackUrl: '/dashboard' })}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', gap: 12, minHeight: 58 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.98 4.7 9.64c.87-1.63 2.43-2.5 4.17-2.5 1.3 0 2.31.83 3.27.83 1.0 0 2.22-1.01 3.15-.83 1.31.25 2.27 1.39 2.79 2.47.87 1.82 1.24 3.55 1.15 3.77-.28.74-1.05.78-1.64.78-.63 0-1.47-.22-2.58-.22-.67 0-2.37.14-3.51.79-1.18.67-1.77 1.84-1.77 3.16 0 1.62 1.05 3.52 1.08 3.57.03.05 1.19 2.23 3.28 2.54 1.05.16 1.83-.48 2.63-.92.8-.44 1.54-1.27 1.73-1.65.19-.38.19-.7-.06-.98-.67-.59-1.85-.72-2.6-.36-.75.36-1.34 1.18-1.47 1.7-.13.5.14 1.1.59 1.48.45.38 1.21.52 1.61.34.4-.18 1.04-.73 1.66-1.46.87-.85 1.29-2.05 1.27-2.22-.02-.52-.71-1.01-1.56-1.69zM12 3.8c.84 0 1.53.69 1.52 1.55-.01.86-.69 1.55-1.52 1.55-.84 0-1.53-.69-1.52-1.55.01-.86.68-1.55 1.52-1.55z"/>
          </svg>
          Continue with Apple
        </button>
      )}
    </div>
  );
}