const encoder = new TextEncoder();

const SECRET_FALLBACK = 'ses-sports-week-2026-secure-admin-token-key';

function getSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    SECRET_FALLBACK
  );
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Creates a cryptographically signed admin session token
 */
export async function signAdminSession(email: string): Promise<string> {
  const secret = getSecret();
  const key = await getCryptoKey(secret);
  const timestamp = Date.now().toString();
  const payload = `${email.toLowerCase().trim()}:${timestamp}`;

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${payload}:${signatureHex}`;
}

/**
 * Cryptographically verifies an admin session token and checks expiration
 */
export async function verifyAdminSession(token?: string | null): Promise<boolean> {
  if (!token) return false;

  const parts = token.split(':');
  if (parts.length !== 3) return false;

  const [email, timestampStr, signatureHex] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Max age: 7 days
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) return false;

  try {
    const secret = getSecret();
    const key = await getCryptoKey(secret);
    const payload = `${email}:${timestampStr}`;

    const sigMatch = signatureHex.match(/.{1,2}/g);
    if (!sigMatch) return false;

    const sigBytes = new Uint8Array(sigMatch.map((byte) => parseInt(byte, 16)));
    return await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload));
  } catch {
    return false;
  }
}
