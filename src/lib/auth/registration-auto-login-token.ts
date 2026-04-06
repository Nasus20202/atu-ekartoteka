import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_SECONDS = 15;
const TOKEN_TTL_MS = TOKEN_TTL_SECONDS * 1000;

function getSecret(): string | null {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? null;
}

function createSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createRegistrationAutoLoginToken(email: string): string | null {
  const secret = getSecret();
  if (!secret) {
    return null;
  }

  const payload = JSON.stringify({
    email,
    exp: Date.now() + TOKEN_TTL_MS,
  });
  const payloadPart = Buffer.from(payload).toString('base64url');
  const signaturePart = createSignature(payloadPart, secret);
  return `${payloadPart}.${signaturePart}`;
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
    ) as {
      email: string;
      exp: number;
    };

    return payload.email === email && payload.exp > Date.now();
  } catch {
    return false;
  }
}
