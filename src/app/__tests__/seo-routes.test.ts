import { describe, expect, it } from 'vitest';

import { metadata as forgotPasswordMetadata } from '@/app/(auth)/forgot-password/layout';
import { metadata as loginMetadata } from '@/app/(auth)/login/layout';
import { metadata as registerMetadata } from '@/app/(auth)/register/layout';
import { metadata as resetPasswordMetadata } from '@/app/(auth)/reset-password/layout';
import { metadata as verifyEmailMetadata } from '@/app/(auth)/verify-email/layout';
import { metadata as privacyMetadata } from '@/app/privacy/layout';
import robots from '@/app/robots';
import { APP_NAME } from '@/lib/shared/document-title';

const publicPages = [
  ['/login', loginMetadata],
  ['/register', registerMetadata],
  ['/forgot-password', forgotPasswordMetadata],
  ['/privacy', privacyMetadata],
] as const;

describe('public page metadata', () => {
  it.each(publicPages)('makes %s indexable', (path, metadata) => {
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates).toEqual({ canonical: path });
  });

  it.each(publicPages)('describes %s for search results', (_, metadata) => {
    expect(metadata.description).toBeTruthy();
    expect(metadata.openGraph).toMatchObject({ siteName: APP_NAME });
    expect(metadata.twitter).toMatchObject({ card: 'summary' });
  });
});

describe('token page metadata', () => {
  it.each([
    ['/reset-password', resetPasswordMetadata],
    ['/verify-email', verifyEmailMetadata],
  ])('leaves %s on the noindex default', (_, metadata) => {
    expect(metadata.robots).toBeUndefined();
    expect(metadata.openGraph).toBeUndefined();
  });
});

describe('robots.txt', () => {
  it('allows the public pages and denies the private sections', () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/admin'],
      },
    });
  });
});
