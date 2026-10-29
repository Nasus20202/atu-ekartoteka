'use client';

import { useEffect, useState } from 'react';

import { getAvailableApartments } from '@/app/admin/users/utils';
import type { ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';
import type { UserDto } from '@/lib/types/dto/user-dto';

const APARTMENT_FETCH_LIMIT = 100000;

/** Apartments the selected user can be assigned, loaded when one is picked. */
export function useAvailableApartments(selectedUser: UserDto | null) {
  const [apartments, setApartments] = useState<ApartmentSummaryDto[]>([]);

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    let cancelled = false;

    async function loadApartments() {
      try {
        const apartmentParams = new URLSearchParams({
          page: '1',
          limit: String(APARTMENT_FETCH_LIMIT),
          activeOnly: 'false',
        });

        const response = await fetch(
          `/api/admin/apartments?${apartmentParams}`
        );
        const data = await response.json();

        if (!response.ok) {
          return;
        }

        const [tenantUsersResponse, adminUsersResponse] = await Promise.all([
          fetch('/api/admin/users?limit=1000'),
          fetch('/api/admin/users?role=ADMIN&limit=1000'),
        ]);
        const [tenantUsersData, adminUsersData] = await Promise.all([
          tenantUsersResponse.json(),
          adminUsersResponse.json(),
        ]);

        if (cancelled) {
          return;
        }

        const allUsers = [
          ...(tenantUsersData.users || []),
          ...(adminUsersData.users || []),
        ];

        setApartments(
          getAvailableApartments(data.apartments, allUsers, selectedUser)
        );
      } catch (error) {
        console.error('Failed to fetch apartments:', error);
      }
    }

    void loadApartments();

    return () => {
      cancelled = true;
    };
  }, [selectedUser]);

  return apartments;
}
