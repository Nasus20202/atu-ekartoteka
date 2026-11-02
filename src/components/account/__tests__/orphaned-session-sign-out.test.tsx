import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OrphanedSessionSignOut } from '@/components/account/orphaned-session-sign-out';

const mockLogout = vi.fn();

vi.mock('@/components/account/use-logout', () => ({
  useLogout: () => ({ logout: mockLogout, pending: false }),
}));

describe('OrphanedSessionSignOut', () => {
  it('signs out once on mount and renders nothing', () => {
    const { container } = render(<OrphanedSessionSignOut />);

    expect(mockLogout).toHaveBeenCalledOnce();
    expect(container).toBeEmptyDOMElement();
  });
});
