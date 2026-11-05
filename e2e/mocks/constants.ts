export const MOCK_HTTP_PORT = Number(process.env.MOCK_HTTP_PORT ?? 4010);
export const MOCK_SMTP_PORT = Number(process.env.MOCK_SMTP_PORT ?? 1025);
export const MOCK_PUBLIC_URL =
  process.env.MOCK_PUBLIC_URL ?? `http://localhost:${MOCK_HTTP_PORT}`;

export const TURNSTILE_VALID_TOKEN = 'mock-valid-token';
export const TURNSTILE_INVALID_TOKEN = 'mock-invalid-token';

export const GOOGLE_CLIENT_ID = 'mock-google-client-id';
export const GOOGLE_PATH = '/google';
export const TURNSTILE_PATH = '/turnstile';
export const MAIL_PATH = '/mail';
export const HEALTH_PATH = '/health';

export const ID_TOKEN_TTL = 3600;
