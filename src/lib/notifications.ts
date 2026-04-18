interface EmailNotification {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmailNotification(notification: EmailNotification): Promise<boolean> {
  console.log('Email notification:', notification);
  return true;
}

export async function notifyPaymentReceived(
  email: string,
  amount: string,
  txHash: string
): Promise<boolean> {
  return sendEmailNotification({
    to: email,
    subject: 'You received crypto!',
    body: `You received ${amount} TRX!\n\nTransaction: ${txHash}\n\nView in dashboard: http://localhost:3000/dashboard`,
  });
}