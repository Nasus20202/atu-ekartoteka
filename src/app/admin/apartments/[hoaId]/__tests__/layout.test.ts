import { describe, expect, it } from 'vitest';

import { metadata } from '@/app/admin/apartments/[hoaId]/layout';
import { PAGE_TITLE_TEMPLATE } from '@/lib/metadata/document-title';

describe('HOA apartments layout metadata', () => {
  it('uses a static title and keeps the app template for nested pages', () => {
    expect(metadata).toEqual({
      title: {
        default: 'Mieszkania wspólnoty',
        template: PAGE_TITLE_TEMPLATE,
      },
    });
  });
});
