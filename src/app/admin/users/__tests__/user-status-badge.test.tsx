import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UserStatusBadge } from '@/app/admin/users/user-status-badge';
import { AccountStatus } from '@/lib/types';

describe('UserStatusBadge', () => {
  it('renders pending badge', () => {
    render(<UserStatusBadge status={AccountStatus.PENDING} />);

    expect(screen.getByText(/oczekuje/i)).toBeInTheDocument();
  });

  it('renders approved badge', () => {
    render(<UserStatusBadge status={AccountStatus.APPROVED} />);

    expect(screen.getByText(/zatwierdzony/i)).toBeInTheDocument();
  });

  it('renders rejected badge', () => {
    render(<UserStatusBadge status={AccountStatus.REJECTED} />);

    expect(screen.getByText(/odrzucony/i)).toBeInTheDocument();
  });
});
