require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function run() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Missing SMTP env vars — check .env.local');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const testRecipient = process.argv[2];
  if (!testRecipient) throw new Error('Usage: node scripts/test-email.js you@example.com');

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || SMTP_USER,
    to: testRecipient,
    subject: 'Dealo OTP test',
    text: 'If you got this, SMTP is working.',
  });

  console.log('Sent:', info.messageId);
}

run().catch((err) => {
  console.error('Email test failed:', err);
  process.exit(1);
});
