import { describe, expect, it } from 'vitest';

import { serializeError } from '@/lib/logging/serialize-error';

class PrismaClientKnownRequestError extends Error {
  code = 'P2002';
  constructor(message: string) {
    super(message);
    this.name = 'PrismaClientKnownRequestError';
  }
}

describe('serializeError', () => {
  it('keeps only name and code of a Prisma error', () => {
    const error = new PrismaClientKnownRequestError(
      'Invalid `prisma.user.create()` invocation: email: "canary@example.com"'
    );

    const result = serializeError(error);

    expect(result).toEqual({
      name: 'PrismaClientKnownRequestError',
      code: 'P2002',
      message: 'PrismaClientKnownRequestError',
    });
    expect(JSON.stringify(result)).not.toContain('canary');
  });

  it('redacts addresses in a transport error message', () => {
    const error = Object.assign(
      new Error('No recipients: canary@example.com'),
      {
        code: 'EENVELOPE',
      }
    );

    expect(serializeError(error)).toEqual({
      name: 'Error',
      code: 'EENVELOPE',
      message: 'No recipients: [redacted-email]',
    });
  });

  it('truncates a long message', () => {
    const result = serializeError(new Error('x'.repeat(500)));

    expect(result.message).toHaveLength(301);
    expect(result.message.endsWith('…')).toBe(true);
  });

  it('does not expose the value of a thrown non-error', () => {
    expect(serializeError('canary@example.com')).toEqual({
      name: 'NonError',
      message: 'string',
    });
  });
});
