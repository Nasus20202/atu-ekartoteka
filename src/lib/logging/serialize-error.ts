import { redactEmails } from '@/lib/logging/redact';

const MAX_MESSAGE_LENGTH = 300;
const PRISMA_ERROR_NAME = /^PrismaClient/;

export interface SerializedError {
  name: string;
  code?: string;
  message: string;
}

function readCode(error: Error): string | undefined {
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' || typeof code === 'number'
    ? String(code)
    : undefined;
}

function truncate(text: string): string {
  return text.length > MAX_MESSAGE_LENGTH
    ? `${text.slice(0, MAX_MESSAGE_LENGTH)}…`
    : text;
}

/**
 * Reduces an error to fields that cannot carry personal data. Prisma messages
 * echo the failed call and its arguments, so only the name and code are kept.
 */
export function serializeError(error: unknown): SerializedError {
  if (!(error instanceof Error)) {
    return { name: 'NonError', message: typeof error };
  }

  const code = readCode(error);
  const result: SerializedError = {
    name: error.name,
    message: PRISMA_ERROR_NAME.test(error.name)
      ? error.name
      : truncate(redactEmails(error.message)),
  };
  if (code) result.code = code;
  return result;
}
