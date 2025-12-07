import fs from 'fs';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { renderEmailTemplate } from '@/lib/email/template-loader';

const TEMPLATE_DIR = path.join(
  process.cwd(),
  'src',
  'lib',
  'email',
  'templates'
);

describe('renderEmailTemplate', () => {
  const filePath = path.join(TEMPLATE_DIR, 'vitest-test.html');

  beforeAll(() => {
    fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
    fs.writeFileSync(filePath, 'Hello {{name}}');
  });

  afterAll(() => {
    try {
      fs.unlinkSync(filePath);
    } catch {}
  });

  it('renders variable substitution', () => {
    const output = renderEmailTemplate('vitest-test', 'html', {
      name: 'Alice',
    });
    expect(output).toContain('Alice');
  });

  it('rejects path traversal filenames', () => {
    expect(() => renderEmailTemplate('../vitest-test', 'html', {})).toThrow();
  });
});
