import crypto from 'crypto';

const FULL_NODE = process.env.TRON_FULL_NODE || 'https://api.shasta.trongrid.io';
const SOLIDITY_NODE = process.env.TRON_SOLIDITY_NODE || 'https://api.shasta.trongrid.io';
const EVENT_SERVER = process.env.TRON_EVENT_SERVER || 'https://api.shasta.trongrid.io';

export const TRON_API_KEY = process.env.TRON_API_KEY;
export const VAULT_CONTRACT_ADDRESS = process.env.VAULT_CONTRACT_ADDRESS || '';
export const TOKEN_VAULT_CONTRACT_ADDRESS = process.env.TOKEN_VAULT_CONTRACT_ADDRESS || '';

export const TRX_TOKEN = 'TRX';
export const USDT_TOKEN = 'TR7NHqjeKQxGTCi8qZLJEoU4y3E2sQ3q6M';

let tronWebInstance: any = null;

function getTronWeb() {
  if (!tronWebInstance) {
    const TronWeb = require('tronweb');
    const TronWebClass = TronWeb.default || TronWeb;
    tronWebInstance = new TronWebClass(
      FULL_NODE,
      SOLIDITY_NODE,
      EVENT_SERVER
    );
  }
  return tronWebInstance;
}

export const tronWeb = {
  get trx() {
    return getTronWeb().trx;
  },
  contract() {
    return getTronWeb().contract();
  },
  isAddress(address: string): boolean {
    return getTronWeb().isAddress(address);
  },
  address: {
    fromPrivateKey(privateKey: string): string {
      return getTronWeb().address.fromPrivateKey(privateKey);
    },
  },
  setPrivateKey(privateKey: string) {
    return getTronWeb().setPrivateKey(privateKey);
  },
};

export async function getWalletBalance(address: string): Promise<number> {
  try {
    const balance = await tronWeb.trx.getBalance(address);
    return balance / 1e6;
  } catch (error) {
    console.error('Error getting balance:', error);
    return 0;
  }
}

export async function getTokenBalance(address: string, tokenAddress: string): Promise<number> {
  try {
    const tronWeb = getTronWeb();
    const contract = await tronWeb.contract().at(tokenAddress);
    const balance = await contract.balanceOf(address).call();
    return parseFloat(balance.toString()) / 1e6;
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
}

export async function sendTRX(
  fromPrivateKey: string,
  toAddress: string,
  amount: number
): Promise<{ success: boolean; txid?: string; error?: string }> {
  try {
    const tronWeb = getTronWeb();
    tronWeb.setPrivateKey(fromPrivateKey);
    const amountSun = Math.floor(amount * 1e6);
    const result = await tronWeb.trx.sendTransaction(toAddress, amountSun);
    return { success: true, txid: result.txid };
  } catch (error) {
    console.error('Error sending TRX:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendToken(
  fromPrivateKey: string,
  toAddress: string,
  amount: number,
  tokenAddress: string
): Promise<{ success: boolean; txid?: string; error?: string }> {
  try {
    const tronWeb = getTronWeb();
    tronWeb.setPrivateKey(fromPrivateKey);
    const contract = await tronWeb.contract().at(tokenAddress);
    const amountSun = Math.floor(amount * 1e6);
    const result = await contract.transfer(toAddress, amountSun).send();
    return { success: true, txid: result };
  } catch (error) {
    console.error('Error sending token:', error);
    return { success: false, error: String(error) };
  }
}

export async function getTransactionInfo(txHash: string): Promise<{
  hash: string;
  block_timestamp: number;
  from: string;
  to: string;
  value: number;
  contract_type: string;
  status: string;
} | null> {
  try {
    const info = await tronWeb.trx.getTransactionInfo(txHash);
    return info;
  } catch (error) {
    return null;
  }
}

export async function getTransactions(
  address: string,
  limit: number = 20
): Promise<Array<{
  txID: string;
  block_timestamp: number;
  from: string;
  to: string;
  value: number;
}>> {
  try {
    const transactions = await tronWeb.trx.getTransactionsRelated(address, limit);
    return transactions.data || [];
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
}

export function validateAddress(address: string): boolean {
  return tronWeb.isAddress(address);
}

export function fromPrivateKeyToAddress(privateKey: string): string {
  return tronWeb.address.fromPrivateKey(privateKey);
}

export function createRandomPrivateKey(): string {
  let privateKey = '';
  while (!privateKey || privateKey.length !== 64) {
    privateKey = crypto.randomBytes(32).toString('hex');
  }
  return privateKey;
}

export async function depositToVault(
  privateKey: string,
  amount: number
): Promise<{ success: boolean; txid?: string; error?: string }> {
  if (!VAULT_CONTRACT_ADDRESS) {
    return { success: false, error: 'Vault not configured' };
  }

  try {
    const tronWeb = getTronWeb();
    tronWeb.setPrivateKey(privateKey);
    const amountSun = Math.floor(amount * 1e6);
    const contract = await tronWeb.contract().at(VAULT_CONTRACT_ADDRESS);
    const result = await contract.deposit().send({ callValue: amountSun });
    return { success: true, txid: result };
  } catch (error) {
    console.error('Error depositing to vault:', error);
    return { success: false, error: String(error) };
  }
}

export async function withdrawFromVault(
  ownerPrivateKey: string,
  recipientAddress: string,
  amount: number
): Promise<{ success: boolean; txid?: string; error?: string }> {
  if (!VAULT_CONTRACT_ADDRESS) {
    return { success: false, error: 'Vault not configured' };
  }

  try {
    const tronWeb = getTronWeb();
    tronWeb.setPrivateKey(ownerPrivateKey);
    const amountSun = Math.floor(amount * 1e6);
    const contract = await tronWeb.contract().at(VAULT_CONTRACT_ADDRESS);
    const result = await contract.withdraw(recipientAddress, amountSun).send();
    return { success: true, txid: result };
  } catch (error) {
    console.error('Error withdrawing from vault:', error);
    return { success: false, error: String(error) };
  }
}