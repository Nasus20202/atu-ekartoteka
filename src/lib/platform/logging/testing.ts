import { expect, type Mock } from 'vitest';

/**
 * Asserts that no argument of any recorded logger call contains one of the
 * canary values (for example a seeded e-mail address).
 */
export function expectNoPersonalData(
  loggerMocks: Mock[],
  canaries: string[]
): void {
  const calls = loggerMocks.flatMap((mock) => mock.mock.calls);
  const serialized = JSON.stringify(calls, (_key, value) =>
    value instanceof Error
      ? { name: value.name, message: value.message }
      : value
  );
  for (const canary of canaries) {
    expect(serialized).not.toContain(canary);
  }
}
