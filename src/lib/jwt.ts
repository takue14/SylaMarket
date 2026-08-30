import { SignJWT, jwtVerify } from 'jose';

const secretValue = process.env.JWT_SECRET;

if (!secretValue || secretValue.length < 32) {
  throw new Error(
    'JWT_SECRET must be set and at least 32 characters long. Generate one with `openssl rand -base64 48`.'
  );
}

const secret = new TextEncoder().encode(secretValue);

export type Role = 'customer' | 'seller' | 'delivery' | 'admin';

export interface SessionPayload {
  id: string;
  role: Role;
}

const SESSION_COOKIE_NAMES: Record<Role, string> = {
  customer: 'session_buyer',
  seller: 'session_seller',
  delivery: 'session_delivery',
  admin: 'session_admin',
};

/**
 * Each role gets its own cookie name so a buyer, seller, and delivery
 * account can all be logged in simultaneously on the same browser without
 * overwriting each other. Logging out one role only ever touches its own
 * cookie.
 */
export function sessionCookieName(role: Role): string {
  return SESSION_COOKIE_NAMES[role];
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const expiresIn = payload.role === 'admin' ? '12h' : '30d';

  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (
      typeof payload.id === 'string' &&
      typeof payload.role === 'string' &&
      ['customer', 'seller', 'delivery', 'admin'].includes(payload.role)
    ) {
      return { id: payload.id, role: payload.role as Role };
    }
    return null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(role: Role) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: role === 'admin' ? 60 * 60 * 12 : 60 * 60 * 24 * 30,
  };
}