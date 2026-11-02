import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const LEGACY_ACCESS =
  'export const read = (p: { legacyClosingBalance: number }) => p.legacyClosingBalance;\n';
const RULE_ID = 'no-restricted-syntax';

// Loading the flat config costs seconds; share one instance across cases.
const eslint = new ESLint({ cwd: process.cwd() });

async function lintRuleIds(filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(LEGACY_ACCESS, { filePath });

  return result.messages.map((message) => message.ruleId ?? '');
}

describe('legacy field restriction', () => {
  // Instantiating ESLint loads the full flat config; under a parallel run this
  // regularly exceeds the 5s default.
  it(
    'rejects legacy identifiers in view code',
    { timeout: 30_000 },
    async () => {
      const ruleIds = await lintRuleIds('src/app/dashboard/legacy-use.ts');

      expect(ruleIds).toContain(RULE_ID);
    }
  );

  it.each([
    'src/lib/import/importers/legacy-use.ts',
    'src/lib/queries/payments/legacy-use.ts',
    'src/app/dashboard/__tests__/legacy-use.ts',
  ])('allows legacy identifiers in %s', async (filePath) => {
    const ruleIds = await lintRuleIds(filePath);

    expect(ruleIds).not.toContain(RULE_ID);
  });
});
