import crypto from 'crypto';

export const FULL_NODE = process.env.TRON_FULL_NODE || 'https://api.nile.org';
export const SOLIDITY_NODE = process.env.TRON_SOLIDITY_NODE || 'https://api.nile.org';
export const EVENT_SERVER = process.env.TRON_EVENT_SERVER || 'https://api.nile.org';

export const TRON_API_KEY = process.env.TRON_API_KEY;
export const VAULT_CONTRACT_ADDRESS = process.env.VAULT_CONTRACT_ADDRESS || '';
export const TOKEN_VAULT_CONTRACT_ADDRESS = process.env.TOKEN_VAULT_CONTRACT_ADDRESS || '';

export const TRX_TOKEN = 'TRX';
export const USDT_TOKEN = 'TR7NHqjeKQxGTCi8qZLJEoU4y3E2sQ3q6M';

let tronWebInstance: any = null;

function getTronWeb() {
  if (!tronWebInstance) {
    const TronWebModule = require('tronweb');
    const TronWebClass = TronWebModule.TronWeb || TronWebModule.default || TronWebModule;
    const headers = TRON_API_KEY ? { 'TRON-PRO-API-KEY': TRON_API_KEY } : undefined;

    tronWebInstance = new TronWebClass({
      fullHost: FULL_NODE,
      solidityNode: SOLIDITY_NODE,
      eventServer: EVENT_SERVER,
      headers,
    });
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
    fromHex(address: string): string {
      return getTronWeb().address.fromHex(address);
    },
  },
  setPrivateKey(privateKey: string) {
    return getTronWeb().setPrivateKey(privateKey);
  },
};

export function createTronAccount(): {
  privateKey: string;
  publicKey: string;
  address: string;
} {
  const tron = getTronWeb();

  try {
    const account = tron.utils.accounts.generateAccount();
    return {
      privateKey: account.privateKey,
      publicKey: account.publicKey,
      address: account.address.base58,
    };
  } catch (e) {
    console.error('Error generating account with TronWeb:', e);
    const privateKey = createRandomPrivateKey();
    return {
      privateKey,
      publicKey: '',
      address: fromPrivateKeyToAddress(privateKey),
    };
  }
}

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

export async function getTransactionInfo(txHash: string): Promise<any | null> {
  try {
    const info = await tronWeb.trx.getTransactionInfo(txHash);
    return info;
  } catch (error) {
    return null;
  }
}

export async function getTransaction(txHash: string): Promise<any | null> {
  try {
    return await tronWeb.trx.getTransaction(txHash);
  } catch (error) {
    return null;
  }
}

export async function verifyTrxPayment(
  txHash: string,
  expected: {
    toAddress: string;
    amountSun: number;
    fromAddress?: string;
  }
): Promise<{
  ok: boolean;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  fromAddress?: string;
  toAddress?: string;
  amountSun?: number;
  error?: string;
}> {
  const tx = await getTransaction(txHash);
  if (!tx?.raw_data?.contract?.length) {
    return { ok: false, status: 'pending', error: 'Transaction not found on chain' };
  }

  const contract = tx.raw_data.contract[0];
  const value = contract?.parameter?.value;

  if (!value?.to_address || typeof value.amount !== 'number') {
    return { ok: false, status: 'failed', error: 'Unsupported transaction payload' };
  }

  const toAddress = tronWeb.address.fromHex(value.to_address);
  const fromAddress = value.owner_address ? tronWeb.address.fromHex(value.owner_address) : undefined;
  const amountSun = Number(value.amount);

  if (toAddress !== expected.toAddress) {
    return { ok: false, status: 'failed', error: 'Transaction recipient mismatch', fromAddress, toAddress, amountSun };
  }

  if (amountSun !== expected.amountSun) {
    return { ok: false, status: 'failed', error: 'Transaction amount mismatch', fromAddress, toAddress, amountSun };
  }

  if (expected.fromAddress && fromAddress && fromAddress !== expected.fromAddress) {
    return { ok: false, status: 'failed', error: 'Transaction sender mismatch', fromAddress, toAddress, amountSun };
  }

  const info = await getTransactionInfo(txHash);
  const receiptResult = info?.receipt?.result;

  if (!info || !receiptResult) {
    return { ok: true, status: 'pending', fromAddress, toAddress, amountSun };
  }

  if (receiptResult !== 'SUCCESS') {
    return {
      ok: false,
      status: 'failed',
      error: `Receipt result: ${receiptResult}`,
      blockNumber: info.blockNumber,
      fromAddress,
      toAddress,
      amountSun,
    };
  }

  return {
    ok: true,
    status: 'confirmed',
    blockNumber: info.blockNumber,
    fromAddress,
    toAddress,
    amountSun,
  };
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
  const tron = getTronWeb();
  if (!tron.isAddress(address)) {
    return false;
  }
  return address.startsWith('T');
}

export function fromPrivateKeyToAddress(privateKey: string): string {
  const tron = getTronWeb();
  try {
    const address = tron.address.fromPrivateKey(privateKey);
    console.log('fromPrivateKeyToAddress:', privateKey.substring(0, 8) + '...', '=>', address);
    return address;
  } catch (e) {
    console.error('Error converting private key to address:', e);
    return '';
  }
}

export function createRandomPrivateKey(): string {
  try {
    const tron = getTronWeb();
    const account = tron.utils.accounts.generateAccount();
    return account.privateKey;
  } catch (e) {
    console.error('Error generating key with TronWeb:', e);
    let privateKey = '';
    while (!privateKey || privateKey.length !== 64) {
      privateKey = crypto.randomBytes(32).toString('hex');
    }
    return privateKey;
  }
}

export function getTronWebInstance() {
  return getTronWeb();
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
