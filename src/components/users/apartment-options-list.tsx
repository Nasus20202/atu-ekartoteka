'use client';

import { REVEAL_CLASS } from '@/components/layout/reveal';
import { ApartmentOption } from '@/components/users/apartment-option';
import { ApartmentOptionsLoading } from '@/components/users/apartment-options-loading';
import { useAvailableApartments } from '@/components/users/use-available-apartments';
import {
  isApartmentMatchingUser,
  pinSelectedAndMatching,
} from '@/components/users/utils';
import type { ApartmentSummaryDto } from '@/lib/apartments/dto/apartment-dto';
import { cn } from '@/lib/shared/utils';
import type { UserDto } from '@/lib/users/dto/user-dto';

interface ApartmentOptionsListProps {
  apartmentSearch: string;
  onApartmentCheckedChange: (
    apartment: ApartmentSummaryDto,
    checked: boolean
  ) => void;
  selectedApartments: string[];
  user: UserDto;
}

export function ApartmentOptionsList({
  apartmentSearch,
  onApartmentCheckedChange,
  selectedApartments,
  user,
}: ApartmentOptionsListProps) {
  const { apartments, failed, loading } = useAvailableApartments(
    user,
    apartmentSearch
  );

  if (loading) {
    return <ApartmentOptionsLoading />;
  }

  if (failed) {
    return (
      <p className="py-4 text-center text-sm text-destructive">
        Nie udało się załadować mieszkań
      </p>
    );
  }

  const filteredApartments = pinSelectedAndMatching(
    apartments,
    selectedApartments,
    user
  );

  return (
    <div className={cn('space-y-2', REVEAL_CLASS)}>
      {filteredApartments.map((apartment) => (
        <ApartmentOption
          key={apartment.id}
          apartment={apartment}
          selected={selectedApartments.includes(apartment.id)}
          matching={isApartmentMatchingUser(apartment, user)}
          onCheckedChange={(checked) =>
            onApartmentCheckedChange(apartment, checked)
          }
        />
      ))}

      {filteredApartments.length === 0 && apartmentSearch && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Nie znaleziono mieszkań
        </p>
      )}
    </div>
  );
}
