import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error('REDIRECT');
  }),
}));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/app/dashboard/settlements/load-default-apartment-id', () => ({
  loadDefaultApartmentId: mocks.load,
}));
vi.mock('@/components/navigation/back-button', () => ({
  BackButton: () => <button type="button">Wstecz</button>,
}));

import { SettlementsEntry } from '@/components/settlements/settlements-entry';

describe('SettlementsEntry', () => {
  it('opens the first apartment', async () => {
    mocks.load.mockResolvedValue('a1');

    await expect(SettlementsEntry()).rejects.toThrow('REDIRECT');
    expect(mocks.redirect).toHaveBeenCalledWith('/dashboard/settlements/a1');
  });

  it('says when the tenant has no apartment', async () => {
    mocks.load.mockResolvedValue(null);

    const { container } = render(await SettlementsEntry());

    expect(
      screen.getByText('Nie masz przypisanych lokali.')
    ).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass(
      'motion-safe:animate-fade-in'
    );
  });
});
