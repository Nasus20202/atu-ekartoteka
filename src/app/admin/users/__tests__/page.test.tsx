import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import AdminUsersPage from '@/app/admin/users/page';

const pending = vi.hoisted(() => ({ section: false }));

vi.mock('@/components/users/admin-users-section', () => ({
  AdminUsersSection: () => {
    if (pending.section) use(new Promise<never>(() => {}));
    return <div>users-loaded</div>;
  },
}));

describe('AdminUsersPage', () => {
  it('renders the users when they are ready', () => {
    pending.section = false;
    render(<AdminUsersPage />);

    expect(screen.getByText('users-loaded')).toBeInTheDocument();
  });

  it('shows a skeleton while the users load', () => {
    pending.section = true;
    render(<AdminUsersPage />);

    expect(screen.queryByText('users-loaded')).not.toBeInTheDocument();
    expect(screen.getByTestId('users-page-skeleton')).toBeInTheDocument();
  });
});
