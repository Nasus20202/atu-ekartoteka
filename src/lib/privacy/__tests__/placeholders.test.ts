import { describe, expect, it } from 'vitest';

import {
  countPlaceholders,
  placeholder,
  PLACEHOLDER_PATTERN,
} from '@/lib/privacy/placeholders';

describe('placeholders', () => {
  it('wraps a label in double square brackets', () => {
    expect(placeholder('nazwa administratora')).toBe(
      '[[nazwa administratora]]'
    );
  });

  it('counts every placeholder', () => {
    expect(countPlaceholders('a [[x]] b [[y z]] c')).toBe(2);
    expect(countPlaceholders('[[x]][[y]]')).toBe(2);
  });

  it('counts none in text without placeholders or with single brackets', () => {
    expect(countPlaceholders('zwykły tekst [link](https://x.pl)')).toBe(0);
    expect(countPlaceholders('')).toBe(0);
  });

  it('matches a placeholder with the shared pattern', () => {
    expect(PLACEHOLDER_PATTERN.test('x [[y]]')).toBe(true);
    expect(PLACEHOLDER_PATTERN.test('x [y]')).toBe(false);
  });
});
