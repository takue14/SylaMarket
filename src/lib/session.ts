import { cookies } from 'next/headers';
import { sessionCookieName, verifySession, Role, SessionPayload } from './jwt';

/**
 * Reads and verifies the session cookie for a SPECIFIC role. Since a
 * buyer, seller, and delivery account can all be logged in on the same
 * browser at once, there is no single "current" session — every call
 * site must say which role's session it's asking about.
 */
export async function getSession(role: Role): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName(role))?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session || session.role !== role) return null; // defense in depth
  return session;
}

/**
 * Checks every role's cookie and returns all that are currently valid.
 * Useful for things like "show the segment tabs if the user is logged
 * in as anything at all" — not for authorizing a specific action.
 */
export async function getAllSessions(): Promise<Partial<Record<Role, SessionPayload>>> {
  const roles: Role[] = ['customer', 'seller', 'delivery', 'admin'];
  const results = await Promise.all(roles.map((r) => getSession(r)));
  const out: Partial<Record<Role, SessionPayload>> = {};
  roles.forEach((r, i) => {
    if (results[i]) out[r] = results[i]!;
  });
  return out;
}

/**
 * Convenience guard: returns the session for the given role only if it
 * matches, otherwise null.
 */
export async function requireRole(role: Role): Promise<SessionPayload | null> {
  return getSession(role);
}