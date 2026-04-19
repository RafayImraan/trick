import { sendPaymentReceivedEmail } from '@/lib/email';

export async function notifyPaymentReceived(
  email: string,
  amount: string,
  txHash: string,
  stealthAddress: string
): Promise<boolean> {
  return sendPaymentReceivedEmail(email, amount, txHash, stealthAddress);
}