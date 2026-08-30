import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

export function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP_HOST, SMTP_USER and SMTP_PASS must be set to send emails');
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

export async function sendOtpEmail(to: string, code: string) {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || '"Dealo" <no-reply@dealo.com>',
    to,
    subject: 'Your Dealo verification code',
    text: `Your verification code is ${code}. It expires in 10 minutes. If you didn't request this, ignore this email.`,
    html: `<p>Your verification code is <strong style="font-size:18px;letter-spacing:2px">${code}</strong>.</p><p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
}
