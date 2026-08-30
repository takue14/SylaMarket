import { NextResponse } from 'next/server';
import { getAllSessions } from '@/lib/session';

export async function GET() {
  const sessions = await getAllSessions();
  const roles = Object.keys(sessions);
  return NextResponse.json({ authenticated: roles.length > 0, roles });
}