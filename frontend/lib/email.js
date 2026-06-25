// Real SMTP email sending, with a safe fallback when SMTP isn't configured.
// Mirrors the existing dev-mode pattern already used by /auth/otp and /auth/forgot
// (console.log + return the code to the client) so behavior is unchanged until
// SMTP_HOST/PORT/USER/PASS are set in the environment.
import nodemailer from 'nodemailer';

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export function isEmailConfigured() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);
}

// Returns { sent: boolean, devCode?: string } — never throws, so a misconfigured
// or unreachable SMTP server never blocks signup/login flows.
export async function sendOtpEmail(email, code, { purpose = 'verify your account', expiryMinutes = 5 } = {}) {
  const t = getTransporter();
  if (!t) {
    console.log(`[OTP-EMAIL] (SMTP not configured) ${email} -> ${code}`);
    return { sent: false, devCode: code };
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `Your DHARA AADHVIKA verification code: ${code}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e5e5;border-radius:8px;">
          <h2 style="color:#15803d;margin-top:0;">DHARA AADHVIKA</h2>
          <p>Use the code below to ${purpose}. It expires in ${expiryMinutes} minutes.</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:6px;background:#f5f5f4;padding:16px;text-align:center;border-radius:6px;color:#15803d;">${code}</div>
          <p style="color:#78716c;font-size:13px;margin-top:20px;">If you didn't request this, you can safely ignore this email.</p>
        </div>`,
    });
    return { sent: true };
  } catch (e) {
    console.error('[OTP-EMAIL] send failed, falling back to dev code:', e.message);
    return { sent: false, devCode: code };
  }
}
