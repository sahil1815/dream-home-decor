/**
 * Lightweight, Edge-safe JWT-like session token signing & verification
 * using native Web Crypto API (HMAC-SHA256).
 * Zero dependencies, safe to run in Edge Middleware, Serverless Lambdas, and Node.js.
 */

export type AdminRole = 'owner' | 'manager' | 'staff';

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  expiresAt: number;
}

export const ADMIN_SESSION_COOKIE = 'dhd_admin_session';
export const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 hours

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.CRON_SECRET ||
    'dhd_secure_fallback_signing_key_replace_in_env_2026'
  );
}

async function signPayload(payloadStr: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(getAuthSecret());
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(payloadStr)
  );

  return Buffer.from(signature).toString('base64url');
}

async function verifySignature(payloadStr: string, signatureBase64: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(getAuthSecret());
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = Buffer.from(signatureBase64, 'base64url');
    return await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      signature,
      encoder.encode(payloadStr)
    );
  } catch {
    return false;
  }
}

export async function createSessionToken(
  user: { id: string; email: string; name: string; role: AdminRole },
  durationSeconds = SESSION_DURATION_SECONDS
): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + durationSeconds;
  const payload: AdminSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    expiresAt,
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = await signPayload(payloadStr);

  return `${payloadStr}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  const [payloadStr, signature] = token.split('.');
  if (!payloadStr || !signature) return null;

  const isValid = await verifySignature(payloadStr, signature);
  if (!isValid) return null;

  try {
    const payload: AdminSession = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString('utf-8')
    );

    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt < now) {
      return null; // Token expired
    }

    return payload;
  } catch {
    return null;
  }
}
