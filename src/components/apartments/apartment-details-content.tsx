'use client';

import { useState } from 'react';

import { ApartmentInfoCard } from '@/components/apartments/apartment-info-card';
import { AssignedUserCard } from '@/components/apartments/assigned-user-card';
import { ChargeNotificationsCard } from '@/components/apartments/charge-notifications-card';
import { AdminChargesList } from '@/components/charges/admin-charges-list';
import { PageHeader } from '@/components/layout/page-header';
import { ApartmentPaymentsSection } from '@/components/payments/apartment-payments-section';
import { useConfirm } from '@/components/providers/confirm-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ApartmentDetailDto } from '@/lib/types/dto/apartment-dto';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';

interface ApartmentDetailsContentProps {
  apartmentId: string;
  initialApartment: ApartmentDetailDto;
}

export function ApartmentDetailsContent({
  apartmentId,
  initialApartment,
}: ApartmentDetailsContentProps) {
  const confirm = useConfirm();

  const [apartment, setApartment] = useState(initialApartment);
  const [updating, setUpdating] = useState(false);

  const handleToggleStatus = async () => {
    const newStatus = !apartment.isActive;
    const confirmed = await confirm({
      title: newStatus ? 'Aktywuj mieszkanie' : 'Dezaktywuj mieszkanie',
      description: newStatus
        ? 'Czy na pewno chcesz aktywować to mieszkanie?'
        : 'Czy na pewno chcesz dezaktywować to mieszkanie?',
      confirmText: newStatus ? 'Aktywuj' : 'Dezaktywuj',
      cancelText: 'Anuluj',
      variant: newStatus ? 'default' : 'destructive',
    });

    if (!confirmed) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/apartments/${apartmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update apartment status');
      }

      setApartment({ ...apartment, isActive: newStatus });
    } catch (error) {
      console.error('Failed to update apartment status:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <PageHeader
        title={`Lokal ${apartment.number} - ${apartment.homeownersAssociation.name}`}
        description={`${formatApartmentLabel(apartment)}, ${apartment.postalCode} ${apartment.city}`}
        showBackButton={true}
      />

      <div className="space-y-6">
        <ApartmentInfoCard
          apartment={apartment}
          updating={updating}
          onToggleStatus={handleToggleStatus}
        />
        {apartment.user && <AssignedUserCard user={apartment.user} />}
        {apartment.chargeNotifications.length > 0 && (
          <ChargeNotificationsCard
            notifications={apartment.chargeNotifications}
          />
        )}

        {apartment.payments.length > 0 && (
          <ApartmentPaymentsSection
            payments={apartment.payments}
            apartmentId={apartmentId}
            apartmentLabel={formatApartmentLabel(apartment)}
            hoaName={apartment.homeownersAssociation.name}
          />
        )}

        {/* Charges */}
        {apartment.charges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Naliczenia</CardTitle>
              <CardDescription>
                Historia naliczeń ({apartment.charges.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminChargesList
                charges={apartment.charges}
                apartmentLabel={formatApartmentLabel(apartment)}
                hoaName={apartment.homeownersAssociation.name}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
