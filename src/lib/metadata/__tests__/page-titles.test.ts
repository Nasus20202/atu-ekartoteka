import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findHoaName: vi.fn(),
  findOwnedApartmentLabel: vi.fn(),
  findApartmentWithHoaName: vi.fn(),
  findUserByIdCached: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/queries/hoa/find-hoa-name', () => ({
  findHoaName: mocks.findHoaName,
}));
vi.mock('@/lib/queries/apartments/find-apartment-label', () => ({
  findOwnedApartmentLabel: mocks.findOwnedApartmentLabel,
  findApartmentWithHoaName: mocks.findApartmentWithHoaName,
}));
vi.mock('@/lib/queries/users/find-user-by-id', () => ({
  findUserByIdCached: mocks.findUserByIdCached,
}));

import {
  getApartmentTitle,
  getChargesTitle,
  getHoaApartmentsTitle,
  getPaymentsYearTitle,
} from '@/lib/metadata/page-titles';
import { AccountStatus, UserRole } from '@/lib/types';

const adminSession = {
  user: { id: 'admin-1', role: UserRole.ADMIN },
};
const ownerSession = {
  user: { id: 'user-1', role: UserRole.TENANT },
};
const ownedApartment = {
  address: 'Mickiewicza',
  building: '3',
  number: '12',
};

describe('admin page titles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the HOA name for an admin', async () => {
    mocks.auth.mockResolvedValue(adminSession);
    mocks.findHoaName.mockResolvedValue({ name: 'KLO11' });

    await expect(getHoaApartmentsTitle('hoa-1')).resolves.toBe('KLO11');
    expect(mocks.findHoaName).toHaveBeenCalledWith('hoa-1');
  });

  it('uses the generic HOA title for a tenant without querying', async () => {
    mocks.auth.mockResolvedValue(ownerSession);

    await expect(getHoaApartmentsTitle('hoa-1')).resolves.toBe(
      'Mieszkania wspólnoty'
    );
    expect(mocks.findHoaName).not.toHaveBeenCalled();
  });

  it('uses the generic HOA title for an anonymous visitor', async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(getHoaApartmentsTitle('hoa-1')).resolves.toBe(
      'Mieszkania wspólnoty'
    );
    expect(mocks.findHoaName).not.toHaveBeenCalled();
  });

  it('uses the generic HOA title for an unknown HOA', async () => {
    mocks.auth.mockResolvedValue(adminSession);
    mocks.findHoaName.mockResolvedValue(null);

    await expect(getHoaApartmentsTitle('missing')).resolves.toBe(
      'Mieszkania wspólnoty'
    );
  });

  it('formats the apartment title with its number and HOA name', async () => {
    mocks.auth.mockResolvedValue(adminSession);
    mocks.findApartmentWithHoaName.mockResolvedValue({
      number: '12',
      homeownersAssociation: { name: 'KLO11' },
    });

    await expect(getApartmentTitle('apt-1')).resolves.toBe('Lokal 12 - KLO11');
  });

  it('uses the generic apartment title for an unknown apartment', async () => {
    mocks.auth.mockResolvedValue(adminSession);
    mocks.findApartmentWithHoaName.mockResolvedValue(null);

    await expect(getApartmentTitle('missing')).resolves.toBe('Lokal');
  });

  it('uses the generic apartment title for a tenant without querying', async () => {
    mocks.auth.mockResolvedValue(ownerSession);

    await expect(getApartmentTitle('apt-1')).resolves.toBe('Lokal');
    expect(mocks.findApartmentWithHoaName).not.toHaveBeenCalled();
  });
});

describe('tenant apartment titles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(ownerSession);
    mocks.findUserByIdCached.mockResolvedValue({
      status: AccountStatus.APPROVED,
    });
  });

  it('shows the address in the charges title for the owner', async () => {
    mocks.findOwnedApartmentLabel.mockResolvedValue(ownedApartment);

    await expect(getChargesTitle('apt-1')).resolves.toBe(
      'Naliczenia - Mickiewicza 3/12'
    );
    expect(mocks.findOwnedApartmentLabel).toHaveBeenCalledWith(
      'apt-1',
      'user-1'
    );
  });

  it('uses the generic charges title when the apartment is not owned', async () => {
    mocks.findOwnedApartmentLabel.mockResolvedValue(null);

    await expect(getChargesTitle('apt-9')).resolves.toBe(
      'Naliczenia mieszkania'
    );
  });

  it('hides the address from an owner whose account is not approved', async () => {
    mocks.findUserByIdCached.mockResolvedValue({
      status: AccountStatus.PENDING,
    });

    await expect(getChargesTitle('apt-1')).resolves.toBe(
      'Naliczenia mieszkania'
    );
    expect(mocks.findOwnedApartmentLabel).not.toHaveBeenCalled();
  });

  it('uses the generic charges title without a session', async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(getChargesTitle('apt-1')).resolves.toBe(
      'Naliczenia mieszkania'
    );
    expect(mocks.findOwnedApartmentLabel).not.toHaveBeenCalled();
  });

  it('shows the year and the address in the payments title for the owner', async () => {
    mocks.findOwnedApartmentLabel.mockResolvedValue(ownedApartment);

    await expect(getPaymentsYearTitle('apt-1', 2025)).resolves.toBe(
      'Wpłaty 2025 - Mickiewicza 3/12'
    );
  });

  it('uses the generic payments title for an invalid year', async () => {
    mocks.findOwnedApartmentLabel.mockResolvedValue(ownedApartment);

    await expect(getPaymentsYearTitle('apt-1', null)).resolves.toBe(
      'Wpłaty mieszkania'
    );
  });

  it('uses the generic payments title when the apartment is not owned', async () => {
    mocks.findOwnedApartmentLabel.mockResolvedValue(null);

    await expect(getPaymentsYearTitle('apt-9', 2025)).resolves.toBe(
      'Wpłaty mieszkania'
    );
  });
});
