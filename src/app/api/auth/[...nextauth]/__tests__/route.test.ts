import { describe, expect, it, vi } from 'vitest';

const { handlers } = vi.hoisted(() => ({
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

vi.mock('@/auth', () => ({ handlers }));

import { GET, POST } from '@/app/api/auth/[...nextauth]/route';

describe('/api/auth/[...nextauth]', () => {
  it('exposes the NextAuth handlers', () => {
    expect(GET).toBe(handlers.GET);
    expect(POST).toBe(handlers.POST);
  });
});
