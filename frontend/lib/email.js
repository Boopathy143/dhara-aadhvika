// Real SMTP email sending via Gmail (or any SMTP host).
// If SMTP is not configured we return { sent: false, devCode } so local dev
// can still see the code; in production with SMTP configured we send a real email.
import nodemailer from 'nodemailer';

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
  return transporter;
}

export function isEmailConfigured() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);
}

function brandedTemplate({ heading, intro, code, expiryMinutes, footer }) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e5e5e5;border-radius:8px;background:#ffffff;">
      <h2 style="color:#15803d;margin-top:0;letter-spacing:1px;">DHARA AADHVIKA</h2>
      <p style="color:#1f2937;font-size:15px;margin:0 0 8px 0;"><strong>${heading}</strong></p>
      <p style="color:#374151;font-size:14px;">${intro}</p>
      <div style="font-size:30px;font-weight:bold;letter-spacing:8px;background:#f5f5f4;padding:18px;text-align:center;border-radius:6px;color:#15803d;margin:18px 0;">${code}</div>
      <p style="color:#78716c;font-size:13px;margin:0 0 4px 0;">This code expires in ${expiryMinutes} minutes.</p>
      <p style="color:#78716c;font-size:12px;margin-top:18px;">${footer || `If you didn't request this, you can safely ignore this email.`}</p>
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:22px 0 12px 0;" />
      <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0;">DHARA AADHVIKA — Pure. Honest. Rooted.</p>
    </div>`;
}

export async function sendOtpEmail(email, code, { purpose = 'verify your account', expiryMinutes = 5 } = {}) {
  const t = getTransporter();
  if (!t) {
    console.log(`[OTP-EMAIL] (SMTP not configured) ${email} -> ${code}`);
    return { sent: false, devCode: code };
  }
  try {
    await t.verify();
console.log("SMTP Connected");
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `Your DHARA AADHVIKA verification code: ${code}`,
      html: brandedTemplate({
        heading: 'Verify your email',
        intro: `Use the code below to ${purpose}.`,
        code,
        expiryMinutes,
      }),
    });
    return { sent: true };
  } catch (e) {
    console.error('[OTP-EMAIL] send failed:', e.message);
    return { sent: false, error: e.message };
  }
}

export async function sendQuotationEmail(email, { customerName, number, validUntil, total, summaryHtml, viewUrl }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[QUOTE-EMAIL] (SMTP not configured) ${email} -> ${number}`);
    return { sent: false };
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `Quotation ${number} from DHARA AADHVIKA`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:24px;border:1px solid #e5e5e5;border-radius:8px;background:#ffffff;">
          <h2 style="color:#15803d;margin-top:0;letter-spacing:1px;">DHARA AADHVIKA</h2>
          <p style="color:#1f2937;font-size:15px;"><strong>Quotation ${number}</strong></p>
          <p style="color:#374151;font-size:14px;">Dear ${customerName || 'Customer'},</p>
          <p style="color:#374151;font-size:14px;">Please find your quotation summary below. This quotation is valid until <strong>${validUntil || 'further notice'}</strong>.</p>
          ${summaryHtml || ''}
          <p style="font-size:16px;color:#15803d;"><strong>Grand Total: ₹${Number(total).toFixed(2)}</strong></p>
          ${viewUrl ? `<p><a href="${viewUrl}" style="display:inline-block;background:#15803d;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">View / Accept Quotation</a></p>` : ''}
          <p style="color:#78716c;font-size:12px;margin-top:18px;">Reply to this email or contact us on WhatsApp to confirm or modify the quote.</p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:22px 0 12px 0;" />
          <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0;">DHARA AADHVIKA — Pure. Honest. Rooted.</p>
        </div>`,
    });
    return { sent: true };
  } catch (e) {
    console.error('[QUOTE-EMAIL] send failed:', e.message);
    return { sent: false, error: e.message };
  }
}

export async function sendPasswordResetEmail(email, code, { expiryMinutes = 30 } = {}) {
  const t = getTransporter();
  if (!t) {
    console.log(`[RESET-EMAIL] (SMTP not configured) ${email} -> ${code}`);
    return { sent: false, devCode: code };
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `Your DHARA AADHVIKA password reset code: ${code}`,
      html: brandedTemplate({
        heading: 'Reset your password',
        intro: `Use the code below to reset your DHARA AADHVIKA account password.`,
        code,
        expiryMinutes,
        footer: `If you didn't request a password reset, you can safely ignore this email — your password will stay the same.`,
      }),
    });
    return { sent: true };
  } catch (e) {
    console.error('[RESET-EMAIL] send failed:', e.message);
    return { sent: false, error: e.message };
  }
}
