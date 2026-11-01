import { Power, PowerOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApartmentDetailDto } from '@/lib/types/dto/apartment-dto';
import { formatDate, formatSharePercent } from '@/lib/utils';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';

interface ApartmentInfoCardProps {
  apartment: ApartmentDetailDto;
  updating: boolean;
  onToggleStatus: () => void;
}

export function ApartmentInfoCard({
  apartment,
  updating,
  onToggleStatus,
}: ApartmentInfoCardProps) {
  return (
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
            <p className="text-sm text-muted-foreground">Właściciel od</p>
            <p className="font-medium">
              {apartment.validFrom
                ? formatDate(new Date(apartment.validFrom))
                : 'Brak'}
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
                onClick={onToggleStatus}
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
              {apartment.address ? formatApartmentLabel(apartment) : 'Brak'}
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
              {formatSharePercent(apartment.shareRatio) ?? 'Brak'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
