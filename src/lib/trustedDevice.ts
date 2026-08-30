import { SignJWT, jwtVerify } from 'jose';
import { Role } from './jwt';

const secretValue = process.env.JWT_SECRET!;
const secret = new TextEncoder().encode(secretValue);

const TRUST_DAYS = 60;

const TRUSTED_DEVICE_COOKIE_NAMES: Record<Role, string> = {
  customer: 'trusted_device_buyer',
  seller: 'trusted_device_seller',
  delivery: 'trusted_device_delivery',
  admin: 'trusted_device_admin',
};

export function trustedDeviceCookieName(role: Role): string {
  return TRUSTED_DEVICE_COOKIE_NAMES[role];
}

interface TrustedDevicePayload {
  contact: string;
  role: Role;
}

export async function signTrustedDevice(payload: TrustedDevicePayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TRUST_DAYS}d`)
    .sign(secret);
}

export async function verifyTrustedDevice(token: string): Promise<TrustedDevicePayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.contact === 'string' && typeof payload.role === 'string') {
      return { contact: payload.contact, role: payload.role as Role };
    }
    return null;
  } catch {
    return null;
  }
}

export function trustedDeviceCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * TRUST_DAYS,
  };
}