import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentApartmentDetailsCardProps {
  address: string;
  building: string | null;
  number: string;
  postalCode: string;
  city: string;
  shareNumerator: number | null;
  shareDenominator: number | null;
}

export function PaymentApartmentDetailsCard({
  address,
  building,
  number,
  postalCode,
  city,
  shareNumerator,
  shareDenominator,
}: PaymentApartmentDetailsCardProps) {
  const sharePercentage =
    shareNumerator && shareDenominator && shareDenominator > 0
      ? ((shareNumerator / shareDenominator) * 100).toFixed(1)
      : '-';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dane lokalu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <div className="font-medium text-muted-foreground">Adres</div>
            <div>
              {address} {building || ''}/{number}
            </div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Miasto</div>
            <div>
              {postalCode} {city}
            </div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">
              Numer lokalu
            </div>
            <div>{number}</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">
              Procent udziału
            </div>
            <div>{sharePercentage}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
