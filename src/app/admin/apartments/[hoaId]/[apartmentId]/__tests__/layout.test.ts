import { describe, expect, it } from 'vitest';

import { metadata } from '@/app/admin/apartments/[hoaId]/[apartmentId]/layout';

describe('apartment layout metadata', () => {
  it('uses a static title', () => {
    expect(metadata).toEqual({ title: 'Lokal' });
  });
});
