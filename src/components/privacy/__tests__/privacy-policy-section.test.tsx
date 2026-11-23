import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  NOT_PUBLISHED_MESSAGE,
  PrivacyPolicySection,
} from '@/components/privacy/privacy-policy-section';

const mocks = vi.hoisted(() => ({
  connection: vi.fn(),
  readPrivacyPolicy: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));
vi.mock('next/server', () => ({ connection: mocks.connection }));
vi.mock('@/lib/settings/queries/app-settings', () => ({
  readPrivacyPolicy: mocks.readPrivacyPolicy,
}));

describe('PrivacyPolicySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connection.mockResolvedValue(undefined);
  });

  it('renders the saved policy without any session check', async () => {
    mocks.readPrivacyPolicy.mockResolvedValue('# Polityka\n\nTekst **ważny**.');

    render(await PrivacyPolicySection());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Polityka' })
    ).toBeInTheDocument();
    expect(screen.getByText('ważny')).toBeInTheDocument();
  });

  it('reads the database at request time, not at build time', async () => {
    mocks.readPrivacyPolicy.mockResolvedValue('Tekst');

    await PrivacyPolicySection();

    expect(mocks.connection).toHaveBeenCalled();
    expect(mocks.connection.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.readPrivacyPolicy.mock.invocationCallOrder[0]
    );
  });

  it('says the policy is not published when none is saved', async () => {
    mocks.readPrivacyPolicy.mockResolvedValue(null);

    render(await PrivacyPolicySection());

    expect(screen.getByText(NOT_PUBLISHED_MESSAGE)).toBeInTheDocument();
  });
});
