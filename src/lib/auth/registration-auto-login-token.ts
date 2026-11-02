import { createHmac, timingSafeEqual } from 'node:crypto';

import { normalizeEmail } from '@/lib/auth/email';

const TOKEN_TTL_SECONDS = 15;
const TOKEN_TTL_MS = TOKEN_TTL_SECONDS * 1000;

interface GrantPayload {
  email: string;
  exp: number;
}

function getSecret(): string | null {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? null;
}

function createSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/**
 * Issues a short-lived Turnstile bypass grant for the just-registered account.
 * The token is stateless: it is bound to the email and a 15 second expiry, so
 * replaying it only skips a Turnstile challenge for the account whose password
 * the caller already knows.
 */
export function createRegistrationAutoLoginToken(email: string): string | null {
  const secret = getSecret();
  if (!secret) {
    return null;
  }

  const payloadPart = Buffer.from(
    JSON.stringify({
      email: normalizeEmail(email),
      exp: Date.now() + TOKEN_TTL_MS,
    })
  ).toString('base64url');

  return `${payloadPart}.${createSignature(payloadPart, secret)}`;
}

export function verifyRegistrationAutoLoginToken(
  token: string | undefined,
  email: string
): boolean {
  const secret = getSecret();
  if (!secret || !token) {
    return false;
  }

  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) {
    return false;
  }

  const expectedSignature = createSignature(payloadPart, secret);
  const signatureBuffer = Buffer.from(signaturePart);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadPart, 'base64url').toString('utf8')
    ) as Partial<GrantPayload>;

    if (typeof payload.email !== 'string' || typeof payload.exp !== 'number') {
      return false;
    }

    return payload.email === normalizeEmail(email) && payload.exp > Date.now();
  } catch {
    return false;
  }
}
