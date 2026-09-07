import type { AuthSessionUser, ScorerAccount, UserRole } from '@/types';

const encoder = new TextEncoder();

const SECRET_FALLBACK = 'ses-sports-week-2026-secure-admin-token-key';

/**
 * 5 Official Scorer accounts authorized specifically for score and result entries.
 */
export const OFFICIAL_SCORERS: ScorerAccount[] = [
  {
    name: 'Sajid',
    email: 'sajid@muet.edu.pk',
    defaultPassword: 'Scorer#Sajid2026',
    role: 'scorer',
  },
  {
    name: 'Abdullah',
    email: 'abdullah@muet.edu.pk',
    defaultPassword: 'Scorer#Abdullah2026',
    role: 'scorer',
  },
  {
    name: 'Zaheer',
    email: 'zaheer@muet.edu.pk',
    defaultPassword: 'Scorer#Zaheer2026',
    role: 'scorer',
  },
  {
    name: 'Aina',
    email: 'aina@muet.edu.pk',
    defaultPassword: 'Scorer#Aina2026',
    role: 'scorer',
  },
  {
    name: 'Tayyaba',
    email: 'tayyaba@muet.edu.pk',
    defaultPassword: 'Scorer#Tayyaba2026',
    role: 'scorer',
  },
];

export function findScorerByEmail(email: string): ScorerAccount | undefined {
  const clean = email.toLowerCase().trim();
  return OFFICIAL_SCORERS.find((s) => s.email.toLowerCase() === clean);
}

export function verifyScorerCredentials(
  email: string,
  password: string
): ScorerAccount | null {
  const scorer = findScorerByEmail(email);
  if (!scorer) return null;
  if (scorer.defaultPassword && password === scorer.defaultPassword) {
    return scorer;
  }
  return null;
}

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
 * Creates a cryptographically signed admin/scorer session token
 */
export async function signAdminSession(
  email: string,
  role: UserRole = 'superadmin',
  name?: string
): Promise<string> {
  const secret = getSecret();
  const key = await getCryptoKey(secret);
  const timestamp = Date.now().toString();
  const cleanEmail = email.toLowerCase().trim();
  const cleanName = encodeURIComponent((name || (role === 'scorer' ? 'Official Scorer' : 'Administrator')).trim());

  // Payload format: email|role|name|timestamp
  const payload = `${cleanEmail}|${role}|${cleanName}|${timestamp}`;

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${payload}.${signatureHex}`;
}

/**
 * Cryptographically verifies an admin/scorer session token and decodes session user
 */
export async function verifyAndDecodeAdminSession(
  token?: string | null
): Promise<AuthSessionUser | null> {
  if (!token) return null;

  // 1. Support new token format: payload.signatureHex
  if (token.includes('.')) {
    const dotIndex = token.lastIndexOf('.');
    if (dotIndex === -1) return null;

    const payload = token.slice(0, dotIndex);
    const signatureHex = token.slice(dotIndex + 1);

    const parts = payload.split('|');
    if (parts.length !== 4) return null;

    const [email, role, encodedName, timestampStr] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return null;

    // Max age: 7 days
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAgeMs) return null;

    try {
      const secret = getSecret();
      const key = await getCryptoKey(secret);
      const sigMatch = signatureHex.match(/.{1,2}/g);
      if (!sigMatch) return null;

      const sigBytes = new Uint8Array(sigMatch.map((b) => parseInt(b, 16)));
      const isValid = await crypto.subtle.verify(
        'HMAC',
        key,
        sigBytes,
        encoder.encode(payload)
      );

      if (!isValid) return null;

      return {
        email,
        role: role as UserRole,
        name: decodeURIComponent(encodedName),
      };
    } catch {
      return null;
    }
  }

  // 2. Backward compatibility for legacy tokens: email:timestamp:signatureHex
  const legacyParts = token.split(':');
  if (legacyParts.length === 3) {
    const [email, timestampStr, signatureHex] = legacyParts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return null;

    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAgeMs) return null;

    try {
      const secret = getSecret();
      const key = await getCryptoKey(secret);
      const payload = `${email}:${timestampStr}`;

      const sigMatch = signatureHex.match(/.{1,2}/g);
      if (!sigMatch) return null;

      const sigBytes = new Uint8Array(sigMatch.map((b) => parseInt(b, 16)));
      const isValid = await crypto.subtle.verify(
        'HMAC',
        key,
        sigBytes,
        encoder.encode(payload)
      );

      if (!isValid) return null;

      // Check if this legacy email belongs to a scorer or admin
      const scorer = findScorerByEmail(email);
      return {
        email,
        role: scorer ? 'scorer' : 'superadmin',
        name: scorer ? scorer.name : 'Administrator',
      };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Convenience boolean check for valid admin/scorer session token
 */
export async function verifyAdminSession(token?: string | null): Promise<boolean> {
  const session = await verifyAndDecodeAdminSession(token);
  return !!session;
}
