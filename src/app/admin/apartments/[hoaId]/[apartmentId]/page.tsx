'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type {
  Apartment,
  Charge,
  ChargeNotification,
  HomeownersAssociation,
  Payment,
  User,
} from '@/lib/types';

type ApartmentDetailsData = Pick<
  Apartment,
  | 'id'
  | 'externalId'
  | 'owner'
  | 'address'
  | 'building'
  | 'number'
  | 'postalCode'
  | 'city'
  | 'area'
  | 'height'
  | 'isActive'
> & {
  homeownersAssociation: HomeownersAssociation;
  user: Omit<User, 'password'> | null;
  charges: Charge[];
  chargeNotifications: ChargeNotification[];
  payments: Payment[];
};

export default function ApartmentDetailsPage() {
  const params = useParams();
  const apartmentId = params.apartmentId as string;

  const [apartment, setApartment] = useState<ApartmentDetailsData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-6xl">
          <p>Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-6xl">
          <p>Nie znaleziono mieszkania</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href={`/admin/apartments/${apartment.homeownersAssociation.id}`}
          >
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót do listy
            </Button>
          </Link>
        </div>

        <h1 className="mb-6 text-3xl font-bold">
          Lokal {apartment.number} - {apartment.homeownersAssociation.name}
        </h1>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informacje podstawowe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID zewnętrzne</p>
                  <p className="font-medium">{apartment.externalId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Numer lokalu</p>
                  <p className="font-medium">{apartment.number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Właściciel</p>
                  <p className="font-medium">{apartment.owner || 'Brak'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {apartment.isActive ? 'Aktywny' : 'Nieaktywny'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Adres</p>
                  <p className="font-medium">
                    {apartment.address
                      ? `${apartment.address} ${apartment.number || ''}`
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
                  <p className="text-sm text-muted-foreground">Powierzchnia</p>
                  <p className="font-medium">
                    {apartment.area ? `${apartment.area / 100} m²` : 'Brak'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wysokość</p>
                  <p className="font-medium">
                    {apartment.height ? `${apartment.height} m` : 'Brak'}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Imię i nazwisko
                    </p>
                    <p className="font-medium">
                      {apartment.user.name || 'Brak'}
                    </p>
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
                          {notification.unitPrice.toFixed(2)} zł
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {notification.totalAmount.toFixed(2)} zł
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 font-bold">
                    <div className="flex justify-between">
                      <span>Razem:</span>
                      <span>
                        {apartment.chargeNotifications
                          .reduce((sum, n) => sum + n.totalAmount, 0)
                          .toFixed(2)}{' '}
                        zł
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
                <div className="space-y-6">
                  {apartment.payments.map((payment) => {
                    const months = [
                      { name: 'Styczeń', value: payment.january },
                      { name: 'Luty', value: payment.february },
                      { name: 'Marzec', value: payment.march },
                      { name: 'Kwiecień', value: payment.april },
                      { name: 'Maj', value: payment.may },
                      { name: 'Czerwiec', value: payment.june },
                      { name: 'Lipiec', value: payment.july },
                      { name: 'Sierpień', value: payment.august },
                      { name: 'Wrzesień', value: payment.september },
                      { name: 'Październik', value: payment.october },
                      { name: 'Listopad', value: payment.november },
                      { name: 'Grudzień', value: payment.december },
                    ];

                    const totalPayments = months.reduce(
                      (sum, month) => sum + month.value,
                      0
                    );

                    return (
                      <div key={payment.id} className="space-y-4">
                        <h3 className="font-semibold">Rok {payment.year}</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">Saldo początkowe:</div>
                          <div className="text-right">
                            {payment.openingBalance.toFixed(2)} zł
                          </div>

                          <div className="font-medium">Naliczenie:</div>
                          <div className="text-right">
                            {payment.totalCharges.toFixed(2)} zł
                          </div>

                          <div className="font-medium">Suma wpłat:</div>
                          <div className="text-right">
                            {totalPayments.toFixed(2)} zł
                          </div>

                          <div className="border-t pt-2 font-bold">
                            Saldo końcowe:
                          </div>
                          <div
                            className={`border-t pt-2 text-right font-bold ${
                              payment.closingBalance < 0
                                ? 'text-green-600'
                                : payment.closingBalance > 0
                                  ? 'text-red-600'
                                  : ''
                            }`}
                          >
                            {payment.closingBalance.toFixed(2)} zł
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="mb-2 text-sm font-semibold">
                            Wpłaty miesięczne:
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {months.map((month) => (
                              <div
                                key={month.name}
                                className="flex justify-between"
                              >
                                <span className="text-muted-foreground">
                                  {month.name}:
                                </span>
                                <span className="font-medium">
                                  {month.value.toFixed(2)} zł
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                <div className="space-y-4">
                  {/* Group by period */}
                  {Object.entries(
                    apartment.charges.reduce(
                      (acc, charge) => {
                        if (!acc[charge.period]) {
                          acc[charge.period] = [];
                        }
                        acc[charge.period].push(charge);
                        return acc;
                      },
                      {} as Record<string, typeof apartment.charges>
                    )
                  )
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([period, charges]) => (
                      <div key={period} className="space-y-2">
                        <h3 className="font-semibold">
                          Okres: {period.slice(0, 4)}/{period.slice(4)}
                        </h3>
                        <div className="space-y-2">
                          {charges.map((charge) => (
                            <div
                              key={charge.id}
                              className="flex items-center justify-between border-b pb-2 last:border-0"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {charge.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {charge.quantity} {charge.unit} ×{' '}
                                  {charge.unitPrice.toFixed(2)} zł
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold">
                                  {charge.totalAmount.toFixed(2)} zł
                                </p>
                              </div>
                            </div>
                          ))}
                          <div className="border-t pt-2 font-bold">
                            <div className="flex justify-between">
                              <span>Razem:</span>
                              <span>
                                {charges
                                  .reduce((sum, c) => sum + c.totalAmount, 0)
                                  .toFixed(2)}{' '}
                                zł
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
