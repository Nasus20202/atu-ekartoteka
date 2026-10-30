'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ApartmentInfoCard } from '@/app/admin/apartments/[hoaId]/[apartmentId]/apartment-info-card';
import { AssignedUserCard } from '@/app/admin/apartments/[hoaId]/[apartmentId]/assigned-user-card';
import { ChargeNotificationsCard } from '@/app/admin/apartments/[hoaId]/[apartmentId]/charge-notifications-card';
import { AdminChargesList } from '@/components/charges/admin-charges-list';
import { Page } from '@/components/layout/page';
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
import { LoadingCard } from '@/components/ui/loading-card';
import type { ApartmentDetailDto } from '@/lib/types/dto/apartment-dto';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';

export default function ApartmentDetailsPage() {
  const params = useParams();
  const apartmentId = params.apartmentId as string;
  const confirm = useConfirm();

  const [apartment, setApartment] = useState<ApartmentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchApartment = async () => {
      try {
        const response = await fetch(`/api/admin/apartments/${apartmentId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch apartment details');
        }
        const data = await response.json();
        setApartment(data);
      } catch (error) {
        console.error('Failed to fetch apartment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApartment();
  }, [apartmentId]);

  const handleToggleStatus = async () => {
    if (!apartment) return;

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

  if (loading) {
    return (
      <Page maxWidth="6xl">
        <LoadingCard />
      </Page>
    );
  }

  if (!apartment) {
    return (
      <Page maxWidth="6xl">
        <p>Nie znaleziono mieszkania</p>
      </Page>
    );
  }

  return (
    <Page maxWidth="6xl">
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
    </Page>
  );
}
