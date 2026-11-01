import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApartmentInfoCard } from '@/app/admin/apartments/[hoaId]/[apartmentId]/apartment-info-card';
import type { ApartmentDetailDto } from '@/lib/types/dto/apartment-dto';

function createApartment(
  overrides: Partial<ApartmentDetailDto> = {}
): ApartmentDetailDto {
  return {
    id: 'apt-1',
    externalOwnerId: 'W1',
    externalApartmentId: 'A1',
    owner: 'Jan Kowalski',
    email: 'user@example.com',
    address: 'Testowa',
    building: '1',
    number: '10',
    postalCode: '00-001',
    city: 'Warszawa',
    shareRatio: 0.1,
    isActive: true,
    homeownersAssociation: { id: 'hoa-1', externalId: 'HOA-1', name: 'W' },
    user: null,
    charges: [],
    chargeNotifications: [],
    payments: [],
    validFrom: null,
    ...overrides,
  };
}

function renderCard(apartment: ApartmentDetailDto) {
  render(
    <ApartmentInfoCard
      apartment={apartment}
      updating={false}
      onToggleStatus={vi.fn()}
    />
  );
}

describe('ApartmentInfoCard owner since', () => {
  it('shows the owner start date', () => {
    renderCard(createApartment({ validFrom: '2025-02-10T12:00:00.000Z' }));

    expect(
      screen.getByText('Właściciel od').nextElementSibling
    ).toHaveTextContent('10.02.2025');
  });

  it('shows Brak when there is no start date', () => {
    renderCard(createApartment({ validFrom: null }));

    expect(
      screen.getByText('Właściciel od').nextElementSibling
    ).toHaveTextContent('Brak');
  });
});
