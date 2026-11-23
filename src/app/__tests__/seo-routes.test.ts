import { describe, expect, it, vi } from 'vitest';

import { metadata as forgotPasswordMetadata } from '@/app/(auth)/forgot-password/layout';
import { metadata as loginMetadata } from '@/app/(auth)/login/layout';
import { metadata as registerMetadata } from '@/app/(auth)/register/layout';
import { metadata as resetPasswordMetadata } from '@/app/(auth)/reset-password/layout';
import { metadata as verifyEmailMetadata } from '@/app/(auth)/verify-email/layout';
import { metadata as privacyMetadata } from '@/app/privacy/layout';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

vi.mock('next/server', () => ({ connection: vi.fn() }));

describe('crawler files', () => {
  it('serves robots and sitemap from the shared SEO module', async () => {
    await expect(robots()).resolves.toMatchObject({
      sitemap: expect.stringMatching(/\/sitemap\.xml$/),
    });
    await expect(sitemap()).resolves.toHaveLength(4);
  });
});

describe('public page layouts', () => {
  it.each([
    ['login', loginMetadata],
    ['register', registerMetadata],
    ['forgot-password', forgotPasswordMetadata],
    ['privacy', privacyMetadata],
  ])('%s is indexable', (_name, metadata) => {
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it.each([
    ['reset-password', resetPasswordMetadata],
    ['verify-email', verifyEmailMetadata],
  ])(
    '%s is token-based and inherits the private default',
    (_name, metadata) => {
      expect(metadata.robots).toBeUndefined();
    }
  );
});
