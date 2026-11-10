import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { metadata } from '@/app/privacy/layout';
import PrivacyPage from '@/app/privacy/page';
import { PrivacyPolicySection } from '@/components/privacy/privacy-policy-section';

const mocks = vi.hoisted(() => ({
  connection: vi.fn(),
  getPrivacyPolicy: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));
vi.mock('next/server', () => ({ connection: mocks.connection }));
vi.mock('@/lib/queries/settings/app-settings', () => ({
  getPrivacyPolicy: mocks.getPrivacyPolicy,
}));

describe('PrivacyPolicySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connection.mockResolvedValue(undefined);
  });

  it('renders the saved policy without any session check', async () => {
    mocks.getPrivacyPolicy.mockResolvedValue('# Polityka\n\nTekst **ważny**.');

    render(await PrivacyPolicySection());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Polityka' })
    ).toBeInTheDocument();
    expect(screen.getByText('ważny')).toBeInTheDocument();
  });

  it('reads the database at request time, not at build time', async () => {
    mocks.getPrivacyPolicy.mockResolvedValue('Tekst');

    await PrivacyPolicySection();

    expect(mocks.connection).toHaveBeenCalled();
    expect(mocks.connection.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.getPrivacyPolicy.mock.invocationCallOrder[0]
    );
  });

  it('says the policy is not published when none is saved', async () => {
    mocks.getPrivacyPolicy.mockResolvedValue(null);

    render(await PrivacyPolicySection());

    expect(
      screen.getByText('Polityka prywatności nie została jeszcze opublikowana.')
    ).toBeInTheDocument();
  });
});

describe('PrivacyPage', () => {
  it('wraps the policy in a page with a main landmark', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('has the policy title', () => {
    expect(metadata.title).toBe('Polityka prywatności');
  });
});
