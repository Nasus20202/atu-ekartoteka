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
    validTo: null,
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

describe('ApartmentInfoCard owner period', () => {
  it('shows only the start date for the current owner', () => {
    renderCard(createApartment({ validFrom: '2025-02-10T12:00:00.000Z' }));

    expect(
      screen.getByText('Okres własności').nextElementSibling
    ).toHaveTextContent('od 10.02.2025');
  });

  it('shows start and end dates for a former owner', () => {
    renderCard(
      createApartment({
        validFrom: '2025-01-01T12:00:00.000Z',
        validTo: '2025-02-09T12:00:00.000Z',
      })
    );

    expect(
      screen.getByText('Okres własności').nextElementSibling
    ).toHaveTextContent('od 01.01.2025 do 09.02.2025');
  });

  it('shows Brak when there are no dates', () => {
    renderCard(createApartment({ validFrom: null, validTo: null }));

    expect(
      screen.getByText('Okres własności').nextElementSibling
    ).toHaveTextContent('Brak');
  });
});
