/**
 * Verifies a Google OAuth access token with Google itself and returns the verified email.
 * The browser can no longer simply claim "I am admin@..."; Google must vouch for it,
 * and the token must have been issued to THIS site's Google client ID.
 */
export async function verifyGoogleAccessToken(
  accessToken: string
): Promise<{ ok: true; email: string; name: string } | { ok: false; error: string }> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  if (!clientId) return { ok: false, error: "Google sign-in is not configured on the server." };
  if (!accessToken) return { ok: false, error: "Google verification token is missing." };

  const base = process.env.GOOGLE_TOKENINFO_URL || "https://oauth2.googleapis.com/tokeninfo";
  try {
    const res = await fetch(`${base}?access_token=${encodeURIComponent(accessToken)}`, { cache: "no-store" });
    if (!res.ok) return { ok: false, error: "Google could not verify this sign-in. Please try again." };
    const info = await res.json();

    if (info.aud !== clientId && info.azp !== clientId) {
      return { ok: false, error: "This Google sign-in was not issued for this website." };
    }
    if (!info.email || String(info.email_verified) !== "true") {
      return { ok: false, error: "Your Google email address is not verified." };
    }
    return { ok: true, email: String(info.email).toLowerCase().trim(), name: info.name ? String(info.name) : "" };
  } catch {
    return { ok: false, error: "Could not reach Google to verify your sign-in." };
  }
}

/** Local development only: with no Google client configured, accept the email as typed. */
export const googleDevBypass = () =>
  process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
