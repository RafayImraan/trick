import 'dotenv/config';
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.log('[Email] SMTP not configured, emails will be logged only');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transporter = createTransporter();

  const from = process.env.SMTP_FROM || 'Trick <noreply@trick.fi>';

  if (!transporter) {
    console.log('[Email] Mock send:', {
      from,
      to: options.to,
      subject: options.subject,
    });
    return true;
  }

  try {
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log('[Email] Sent to:', options.to);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

export async function sendPaymentReceivedEmail(
  to: string,
  amount: string,
  txHash: string,
  stealthAddress: string
): Promise<boolean> {
  const subject = 'You received crypto!';
  const text = `You received ${amount} TRX!\n\nTransaction: ${txHash}\nStealth Address: ${stealthAddress}\n\nView in dashboard: https://trick.fi/dashboard`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trick - Payment Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fffdfa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffdfa;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(255, 67, 54, 0.08);">
            <tr>
              <td style="background: linear-gradient(135deg, #ff4336 0%, #ff6f56 100%); padding: 32px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-family: 'Space Grotesk', sans-serif;">Trick</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 32px;">
                <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 24px;">You received crypto!</h2>
                <div style="background: #fff5f5; border-radius: 12px; padding: 24px; margin: 24px 0;">
                  <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px;">Amount Received</p>
                  <p style="margin: 0; color: #ff4336; font-size: 32px; font-weight: 700;">${amount} TRX</p>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                      <p style="margin: 0 0 4px 0; color: #666666; font-size: 12px;">Transaction Hash</p>
                      <code style="color: #1a1a1a; font-size: 12px; word-break: break-all;">${txHash}</code>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <p style="margin: 0 0 4px 0; color: #666666; font-size: 12px;">Stealth Address</p>
                      <code style="color: #1a1a1a; font-size: 12px; word-break: break-all;">${stealthAddress}</code>
                    </td>
                  </tr>
                </table>
                <div style="margin-top: 32px;">
                  <a href="https://trick.fi/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ff4336 0%, #ff6f56 100%); color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600;">View Dashboard</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background: #f5f5f5; padding: 24px 32px; text-align: center;">
                <p style="margin: 0; color: #666666; font-size: 12px;">Privacy-first crypto transfers on TRON</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();

  return sendEmail({ to, subject, text, html });
}

export async function sendWithdrawalConfirmationEmail(
  to: string,
  amount: string,
  toAddress: string,
  txHash: string
): Promise<boolean> {
  const subject = 'Withdrawal Confirmed';
  const text = `Your withdrawal of ${amount} TRX has been initiated.\n\nTo Address: ${toAddress}\nTransaction: ${txHash}\n\nView in dashboard: https://trick.fi/dashboard`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trick - Withdrawal Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fffdfa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffdfa;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(255, 67, 54, 0.08);">
            <tr>
              <td style="background: linear-gradient(135deg, #ff4336 0%, #ff6f56 100%); padding: 32px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-family: 'Space Grotesk', sans-serif;">Trick</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 32px;">
                <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 24px;">Withdrawal Initiated</h2>
                <div style="background: #f0fff4; border-radius: 12px; padding: 24px; margin: 24px 0;">
                  <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px;">Amount Withdrawn</p>
                  <p style="margin: 0; color: #00aa55; font-size: 32px; font-weight: 700;">${amount} TRX</p>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                      <p style="margin: 0 0 4px 0; color: #666666; font-size: 12px;">To Address</p>
                      <code style="color: #1a1a1a; font-size: 12px; word-break: break-all;">${toAddress}</code>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <p style="margin: 0 0 4px 0; color: #666666; font-size: 12px;">Transaction Hash</p>
                      <code style="color: #1a1a1a; font-size: 12px; word-break: break-all;">${txHash}</code>
                    </td>
                  </tr>
                </table>
                <div style="margin-top: 32px;">
                  <a href="https://trick.fi/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ff4336 0%, #ff6f56 100%); color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600;">View Dashboard</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background: #f5f5f5; padding: 24px 32px; text-align: center;">
                <p style="margin: 0; color: #666666; font-size: 12px;">Privacy-first crypto transfers on TRON</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();

  return sendEmail({ to, subject, text, html });
}

export async function sendNewPaymentLinkEmail(
  to: string,
  link: string,
  linkCode: string
): Promise<boolean> {
  const subject = 'Your new Trick payment link';
  const fullLink = `https://trick.fi/pay/${linkCode}`;
  const text = `Your new payment link has been created.\n\nLink: ${fullLink}\n\nShare this link to receive crypto privately.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trick - New Payment Link</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fffdfa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffdfa;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(255, 67, 54, 0.08);">
            <tr>
              <td style="background: linear-gradient(135deg, #ff4336 0%, #ff6f56 100%); padding: 32px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-family: 'Space Grotesk', sans-serif;">Trick</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 32px;">
                <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 24px;">New Payment Link Created</h2>
                <p style="color: #666666; margin: 0 0 24px 0;">Share this link to receive crypto privately.</p>
                <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin: 24px 0; word-break: break-all;">
                  <code style="color: #1a1a1a; font-size: 14px;">${fullLink}</code>
                </div>
                <div style="margin-top: 24px;">
                  <a href="${fullLink}" style="display: inline-block; background: linear-gradient(135deg, #ff4336 0%, #ff6f56 100%); color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600;">View Link</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background: #f5f5f5; padding: 24px 32px; text-align: center;">
                <p style="margin: 0; color: #666666; font-size: 12px;">Privacy-first crypto transfers on TRON</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();

  return sendEmail({ to, subject, text, html });
}