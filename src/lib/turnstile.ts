import { createLogger } from '@/lib/logger';

const logger = createLogger('lib:turnstile');

export interface TurnstileServerValidationResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

/**
 * Check if Turnstile is properly configured and enabled.
 */
export function isTurnstileEnabled(): boolean {
  const siteKey = process.env.TURNSTILE_SITE_KEY;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  return !!(siteKey && secretKey);
}

/**
 * Verify a Turnstile token server-side using the Cloudflare Turnstile API.
 * Returns true when token is valid or when Turnstile is disabled.
 */
export async function verifyTurnstileToken(
  token: string | undefined
): Promise<boolean> {
  // If Turnstile is not configured, skip verification
  if (!isTurnstileEnabled()) {
    logger.info('Turnstile is not configured; skipping verification');
    return true;
  }

  if (!token) {
    logger.warn({ token }, 'No turnstile token provided');
    return false;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    logger.warn('TURNSTILE_SECRET_KEY not set; skipping verification (dev)');
    // In development, if secret is not set we assume validation passes for convenience.
    return true;
  }

  try {
    const body = new URLSearchParams();
    body.append('secret', secret);
    body.append('response', token);

    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      }
    );

    const json = (await res.json()) as TurnstileServerValidationResponse;
    if (!json.success) {
      logger.warn({ json }, 'Turnstile verification failed');
    }
    return Boolean(json.success);
  } catch (error) {
    logger.error({ error }, 'Error while verifying turnstile token');
    // Conservatively fail verification on unknown errors
    return false;
  }
}

export default verifyTurnstileToken;
