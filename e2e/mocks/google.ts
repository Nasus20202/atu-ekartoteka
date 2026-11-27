import {
  createHash,
  createSign,
  generateKeyPairSync,
  randomBytes,
} from 'crypto';

import {
  GOOGLE_CLIENT_ID,
  GOOGLE_LOGIN_EMAIL_PARAM,
  GOOGLE_LOGIN_NAME_PARAM,
  ID_TOKEN_TTL,
  MOCK_PUBLIC_URL,
} from './constants';
import { createMockLogger } from './logger';

const log = createMockLogger('mock:google');

export interface GoogleIdentity {
  email: string;
  name: string;
  sub: string;
}

interface IssuedCode {
  identity: GoogleIdentity;
  nonce: string | null;
}

const KEY_ID = 'mock-google-key';
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

const codes = new Map<string, IssuedCode>();
let nextIdentity: GoogleIdentity | null = null;

export function setNextIdentity(identity: GoogleIdentity): void {
  nextIdentity = identity;
  log.info({ sub: identity.sub, email: identity.email }, 'identity queued');
}

export function discoveryDocument(issuer: string, path: string) {
  return {
    issuer,
    authorization_endpoint: `${MOCK_PUBLIC_URL}${path}/authorize`,
    token_endpoint: `${issuer}/token`,
    userinfo_endpoint: `${issuer}/userinfo`,
    jwks_uri: `${issuer}/jwks`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic'],
  };
}

export function jwks() {
  return {
    keys: [
      {
        ...publicKey.export({ format: 'jwk' }),
        kid: KEY_ID,
        alg: 'RS256',
        use: 'sig',
      },
    ],
  };
}

export type AuthorizeOutcome =
  | { kind: 'redirect'; location: string }
  | { kind: 'login-form' }
  | { kind: 'rejected' };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;
const SUB_LENGTH = 32;

/** The same email always maps to the same Google account. */
function subjectForEmail(email: string): string {
  return createHash('sha256').update(email).digest('hex').slice(0, SUB_LENGTH);
}

/** Identity typed into the mock sign-in form, or null when the email is missing or malformed. */
function identityFromLoginForm(params: URLSearchParams): GoogleIdentity | null {
  const email = (params.get(GOOGLE_LOGIN_EMAIL_PARAM) ?? '')
    .trim()
    .toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return null;
  const name =
    (params.get(GOOGLE_LOGIN_NAME_PARAM) ?? '').trim() || email.split('@')[0];
  return { email, name, sub: subjectForEmail(email) };
}

/**
 * Authorizes with the queued identity, else with the sign-in form's values,
 * else serves the sign-in form.
 */
export function authorize(params: URLSearchParams): AuthorizeOutcome {
  const redirectUri = params.get('redirect_uri');
  if (!redirectUri) {
    log.warn({ hasRedirectUri: false }, 'authorize rejected');
    return { kind: 'rejected' };
  }

  const identity = nextIdentity ?? identityFromLoginForm(params);
  if (!identity) {
    log.info('sign-in form served');
    return { kind: 'login-form' };
  }

  const code = randomBytes(16).toString('hex');
  codes.set(code, { identity, nonce: params.get('nonce') });
  log.info({ sub: identity.sub }, 'authorization code issued');
  nextIdentity = null;

  const target = new URL(redirectUri);
  target.searchParams.set('code', code);
  const state = params.get('state');
  if (state) target.searchParams.set('state', state);
  return { kind: 'redirect', location: target.toString() };
}

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

function signIdToken(issuer: string, { identity, nonce }: IssuedCode): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: KEY_ID };
  const payload = {
    iss: issuer,
    aud: GOOGLE_CLIENT_ID,
    sub: identity.sub,
    email: identity.email,
    email_verified: true,
    name: identity.name,
    iat: now,
    exp: now + ID_TOKEN_TTL,
    ...(nonce && { nonce }),
  };
  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signature = createSign('RSA-SHA256')
    .update(signingInput)
    .sign(privateKey);
  return `${signingInput}.${base64Url(signature)}`;
}

export function exchangeCode(code: string | null, issuer: string) {
  const issued = code ? codes.get(code) : undefined;
  if (!code || !issued) {
    log.warn({ reason: 'invalid_grant' }, 'token exchange rejected');
    return null;
  }
  codes.delete(code);
  log.info({ sub: issued.identity.sub }, 'token exchanged');

  return {
    access_token: `mock-access-${code}`,
    token_type: 'Bearer',
    expires_in: ID_TOKEN_TTL,
    id_token: signIdToken(issuer, issued),
  };
}
