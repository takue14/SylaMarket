import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  // Recommendations are personalized to the logged-in buyer — never trust
  // a client-supplied userId, derive it from the real session.
  const session = await getSession('customer');
  if (!session) {
    return NextResponse.json({ products: [] }); // guests just get no personalized recs, not an error
  }

  const flaskUrl = process.env.RECOMMENDATIONS_SERVICE_URL;
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!flaskUrl || !internalKey) {
    console.error('Recommendations service not configured (missing env vars).');
    return NextResponse.json({ products: [] });
  }

  try {
    const res = await fetch(`${flaskUrl}/api/recommendations?user_id=${encodeURIComponent(session.id)}`, {
      headers: { 'X-Internal-Api-Key': internalKey },
      signal: AbortSignal.timeout(8000), // don't let a slow/dead Flask service hang the page
    });

    if (!res.ok) {
      console.error('Recommendations service returned', res.status);
      return NextResponse.json({ products: [] });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Recommendations fetch failed:', err);
    return NextResponse.json({ products: [] }); // fail soft — recommendations are non-critical
  }
}