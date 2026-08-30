/**
 * IMPORTANT: callers must pass an already-E.164-normalized number
 * (e.g. +263771234567) — see src/lib/phone.ts::normalizePhone(). This
 * file does not validate or reformat numbers itself; both Twilio and
 * Africa's Talking require E.164 input to reliably deliver internationally.
 */
/**
 * SMS provider is swappable via SMS_PROVIDER env var so you can move from
 * Twilio to Africa's Talking (often better coverage/pricing for
 * Zimbabwe/African numbers) without touching any calling code.
 */

interface SmsProvider {
  send(to: string, body: string): Promise<void>;
}

class TwilioProvider implements SmsProvider {
  async send(to: string, body: string) {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
      throw new Error('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER must be set');
    }
    const twilio = (await import('twilio')).default;
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    await client.messages.create({ body, from: TWILIO_FROM_NUMBER, to });
  }
}

class AfricasTalkingProvider implements SmsProvider {
  async send(to: string, body: string) {
    const { AT_API_KEY, AT_USERNAME, AT_SENDER_ID } = process.env;
    if (!AT_API_KEY || !AT_USERNAME) {
      throw new Error('AT_API_KEY and AT_USERNAME must be set');
    }
    const AfricasTalking = (await import('africastalking')).default;
    const client = AfricasTalking({ apiKey: AT_API_KEY, username: AT_USERNAME });
    await client.SMS.send({
      to: [to],
      message: body,
      ...(AT_SENDER_ID ? { from: AT_SENDER_ID } : {}),
    });
  }
}

function getProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER || 'twilio';
  if (provider === 'africastalking') return new AfricasTalkingProvider();
  return new TwilioProvider();
}

export async function sendOtpSms(to: string, code: string) {
  await getProvider().send(to, `Your Dealo verification code is ${code}. It expires in 10 minutes.`);
}
