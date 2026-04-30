'use client';

import { Power, PowerOff } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AdminChargesList } from '@/components/charges/admin-charges-list';
import { useConfirm } from '@/components/confirm-dialog';
import { Page } from '@/components/page';
import { PageHeader } from '@/components/page-header';
import { AdminPaymentsList } from '@/components/payments/admin-payments-list';
import type { SerializableCharge } from '@/components/pdf/download-charges-pdf-button';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoadingCard } from '@/components/ui/loading-card';
import { sumDecimals } from '@/lib/money/sum';
import type {
  Apartment,
  ChargeNotification,
  HomeownersAssociation,
  Payment,
  User,
} from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

type ApartmentDetailsData = Pick<
  Apartment,
  | 'id'
  | 'externalOwnerId'
  | 'externalApartmentId'
  | 'owner'
  | 'email'
  | 'address'
  | 'building'
  | 'number'
  | 'postalCode'
  | 'city'
  | 'shareNumerator'
  | 'shareDenominator'
  | 'isActive'
> & {
  homeownersAssociation: HomeownersAssociation;
  user: Omit<User, 'password'> | null;
  charges: (SerializableCharge & { period: string })[];
  chargeNotifications: ChargeNotification[];
  payments: Payment[];
};

export default function ApartmentDetailsPage() {
  const params = useParams();
  const apartmentId = params.apartmentId as string;
  const confirm = useConfirm();

  const [apartment, setApartment] = useState<ApartmentDetailsData | null>(null);
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
        description={`${apartment.address} ${apartment.building}/${apartment.number}, ${apartment.postalCode} ${apartment.city}`}
        showBackButton={true}
      />

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informacje podstawowe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">ID zewnętrzne</p>
                <p className="font-medium">
                  {apartment.externalApartmentId} / {apartment.externalOwnerId}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Numer lokalu</p>
                <p className="font-medium">{apartment.number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Właściciel</p>
                <p className="font-medium">
                  {apartment.owner || 'Brak'} ({apartment.email || 'Brak'})
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      apartment.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {apartment.isActive ? 'Aktywny' : 'Nieaktywny'}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={handleToggleStatus}
                    disabled={updating}
                  >
                    {apartment.isActive ? (
                      <>
                        <PowerOff className="mr-1 h-3 w-3" />
                        Dezaktywuj
                      </>
                    ) : (
                      <>
                        <Power className="mr-1 h-3 w-3" />
                        Aktywuj
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Adres</p>
                <p className="font-medium">
                  {apartment.address
                    ? `${apartment.address} ${apartment.building || ''}/${apartment.number || ''}`
                    : 'Brak'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Kod pocztowy / Miasto
                </p>
                <p className="font-medium">
                  {apartment.postalCode && apartment.city
                    ? `${apartment.postalCode} ${apartment.city}`
                    : 'Brak'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Procent udziału</p>
                <p className="font-medium">
                  {apartment.shareNumerator &&
                  apartment.shareDenominator &&
                  apartment.shareDenominator > 0
                    ? (
                        (apartment.shareNumerator /
                          apartment.shareDenominator) *
                        100
                      ).toFixed(1)
                    : 'Brak'}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Assignment */}
        {apartment.user && (
          <Card>
            <CardHeader>
              <CardTitle>Przypisany użytkownik</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Imię i nazwisko
                  </p>
                  <p className="font-medium">{apartment.user.name || 'Brak'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{apartment.user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charge Notifications */}
        {apartment.chargeNotifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Powiadomienia czynszowe</CardTitle>
              <CardDescription>
                Aktywne pozycje opłat ({apartment.chargeNotifications.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {apartment.chargeNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.quantity} {notification.unit} ×{' '}
                        {formatCurrency(notification.unitPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCurrency(notification.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 font-bold">
                  <div className="flex justify-between">
                    <span>Razem:</span>
                    <span>
                      {formatCurrency(
                        sumDecimals(
                          apartment.chargeNotifications.map(
                            (notification) => notification.totalAmount
                          )
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payments */}
        {apartment.payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historia wpłat</CardTitle>
              <CardDescription>
                Zapisane okresy rozliczeniowe ({apartment.payments.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminPaymentsList
                payments={apartment.payments}
                apartmentId={apartmentId}
                apartmentLabel={`${apartment.address} ${apartment.building}/${apartment.number}`}
                hoaName={apartment.homeownersAssociation.name}
              />
            </CardContent>
          </Card>
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
                apartmentLabel={`${apartment.address} ${apartment.building}/${apartment.number}`}
                hoaName={apartment.homeownersAssociation.name}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </Page>
  );
}
