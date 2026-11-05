import { createSign, generateKeyPairSync, randomBytes } from 'crypto';

import { GOOGLE_CLIENT_ID, ID_TOKEN_TTL, MOCK_PUBLIC_URL } from './constants';
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

/** Returns the redirect back to the app, or null when no identity is queued. */
export function authorize(params: URLSearchParams): string | null {
  const redirectUri = params.get('redirect_uri');
  if (!redirectUri || !nextIdentity) {
    log.warn(
      { hasRedirectUri: Boolean(redirectUri), identityQueued: false },
      'authorize rejected'
    );
    return null;
  }

  const code = randomBytes(16).toString('hex');
  codes.set(code, { identity: nextIdentity, nonce: params.get('nonce') });
  log.info({ sub: nextIdentity.sub }, 'authorization code issued');
  nextIdentity = null;

  const target = new URL(redirectUri);
  target.searchParams.set('code', code);
  const state = params.get('state');
  if (state) target.searchParams.set('state', state);
  return target.toString();
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
