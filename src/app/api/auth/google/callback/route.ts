import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Customer from '@/models/Customer';
import { exchangeCodeForTokens, fetchGoogleProfile } from '@/lib/googleOAuth';
import { signSession, sessionCookieName, sessionCookieOptions } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = req.cookies.get('google_oauth_state')?.value;

  const failRedirect = (reason: string) =>
    NextResponse.redirect(new URL(`/?googleError=${encodeURIComponent(reason)}`, req.url));

  if (!code || !state || !storedState || state !== storedState) {
    return failRedirect('Invalid or expired sign-in attempt. Please try again.');
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await fetchGoogleProfile(tokens.access_token);

    if (!profile.email || !profile.email_verified) {
      return failRedirect('Your Google account email is not verified.');
    }

    await connectToDB();
    const normalizedEmail = profile.email.toLowerCase().trim();

    let customer = await Customer.findOne({ googleId: profile.sub });
    if (!customer) {
      // No account linked to this Google identity yet — if an existing
      // password-based account already uses this (Google-verified) email,
      // link them instead of creating a duplicate.
      customer = await Customer.findOne({ email: normalizedEmail });
      if (customer) {
        customer.googleId = profile.sub;
        if (!customer.provider || customer.provider === 'password') {
          // leave provider as 'password' if they already had one — this
          // just adds Google as an additional way in, doesn't overwrite
        }
        await customer.save();
      } else {
        customer = await Customer.create({
          name: profile.name || 'Google User',
          email: normalizedEmail,
          googleId: profile.sub,
          provider: 'google',
        });
      }
    }

    const token = await signSession({ id: customer._id.toString(), role: 'customer' });
    const response = NextResponse.redirect(
      new URL(`/auth/google-complete?customerId=${customer._id.toString()}`, req.url)
    );
   response.cookies.set(sessionCookieName('customer'), token, sessionCookieOptions('customer'));
    response.cookies.delete('google_oauth_state');
    return response;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return failRedirect('Google sign-in failed. Please try again.');
  }
}