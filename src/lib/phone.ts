import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

/**
 * Normalizes any phone number to E.164 format (+<countrycode><number>),
 * so OTP delivery works for numbers from any country, not just one.
 * If the input already includes a country code (leading +), that's used.
 * Otherwise `defaultCountry` is assumed — change this to your primary
 * market, but don't rely on it: encourage users to type numbers with
 * their country code (e.g. +263...) for reliable international delivery.
 */
export function normalizePhone(raw: string, defaultCountry: CountryCode = 'ZW'): string | null {
  const parsed = parsePhoneNumberFromString(raw, defaultCountry);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number; // E.164, e.g. +263771234567
}