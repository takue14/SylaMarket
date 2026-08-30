import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieName, Role } from '@/lib/jwt';
import { trustedDeviceCookieName } from '@/lib/trustedDevice';

export async function POST(req: NextRequest) {
  const { role } = await req.json().catch(() => ({ role: null }));

  if (!role || !['customer', 'seller', 'delivery', 'admin'].includes(role)) {
    return NextResponse.json({ message: 'A valid role is required to log out.' }, { status: 400 });
  }

  const response = NextResponse.json({ message: 'Logged out.' });
  response.cookies.delete(sessionCookieName(role as Role));
  response.cookies.delete(trustedDeviceCookieName(role as Role));
  return response;
}