import { Paynow } from 'paynow';

export function getPaynowClient() {
  const { PAYNOW_INTEGRATION_ID, PAYNOW_INTEGRATION_KEY, PAYNOW_RETURN_URL, PAYNOW_RESULT_URL } = process.env;
  if (!PAYNOW_INTEGRATION_ID || !PAYNOW_INTEGRATION_KEY || !PAYNOW_RETURN_URL || !PAYNOW_RESULT_URL) {
    throw new Error('Paynow environment variables are not fully configured.');
  }

  const paynow = new Paynow(PAYNOW_INTEGRATION_ID, PAYNOW_INTEGRATION_KEY);
  paynow.resultUrl = PAYNOW_RESULT_URL;
  paynow.returnUrl = PAYNOW_RETURN_URL;
  return paynow;
}