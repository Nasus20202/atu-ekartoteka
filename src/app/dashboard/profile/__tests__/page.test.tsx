import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import ProfilePage from '@/app/dashboard/profile/page';

const pending = vi.hoisted(() => ({ value: false }));

vi.mock('@/components/navigation/back-button', () => ({
  BackButton: () => <button type="button">Wstecz</button>,
}));
vi.mock('@/components/account/profile-content', () => ({
  ProfileContent: () => <Content />,
}));

function Content() {
  if (pending.value) {
    use(new Promise<never>(() => {}));
  }

  return <div>profile-loaded</div>;
}

describe('ProfilePage', () => {
  it('shows the header and a form skeleton while the profile loads', () => {
    pending.value = true;

    const { container } = render(<ProfilePage />);

    expect(screen.getByRole('heading', { name: 'Profil' })).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByText('profile-loaded')).not.toBeInTheDocument();
  });

  it('replaces the skeleton with the form', () => {
    pending.value = false;

    render(<ProfilePage />);

    expect(screen.getByText('profile-loaded')).toBeInTheDocument();
  });
});
