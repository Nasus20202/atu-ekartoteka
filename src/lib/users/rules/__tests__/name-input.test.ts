import { describe, expect, it } from 'vitest';

import { isNameInputValid } from '@/lib/users/rules/name-input';

describe('isNameInputValid', () => {
  it.each([undefined, null, '', 'Jan Kowalski'])(
    'accepts %p, because a name is optional and a string when sent',
    (name) => {
      expect(isNameInputValid(name)).toBe(true);
    }
  );

  it.each([42, true, {}, ['Jan']])(
    'rejects %p, which is not a string',
    (name) => {
      expect(isNameInputValid(name)).toBe(false);
    }
  );
});
