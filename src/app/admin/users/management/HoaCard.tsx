import { ApartmentCount } from '@/components/ui/apartment-count';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export interface UnassignedApartment {
  id: string;
  number: string;
  building: string | null;
  owner: string | null;
  email: string;
}

export interface HoaGroup {
  hoaId: string;
  hoaName: string;
  apartments: UnassignedApartment[];
}

interface HoaCardProps {
  hoa: HoaGroup;
  selectedIds: Set<string>;
  isHoaSelected: boolean;
  isHoaIndeterminate: boolean;
  onToggleHoa: () => void;
  onToggleApartment: (id: string) => void;
}

export function HoaCard({
  hoa,
  selectedIds,
  isHoaSelected,
  isHoaIndeterminate,
  onToggleHoa,
  onToggleApartment,
}: HoaCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-base">
          <Checkbox
            id={`hoa-${hoa.hoaId}`}
            checked={isHoaSelected}
            data-indeterminate={isHoaIndeterminate}
            onCheckedChange={onToggleHoa}
            aria-label={`Zaznacz wszystkie w ${hoa.hoaName}`}
          />
          <label htmlFor={`hoa-${hoa.hoaId}`} className="cursor-pointer">
            {hoa.hoaName}
          </label>
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            <ApartmentCount count={hoa.apartments.length} />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {hoa.apartments.map((apt) => (
          <label
            key={apt.id}
            htmlFor={`apt-${apt.id}`}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted ${selectedIds.has(apt.id) ? 'border-primary bg-primary/5' : ''}`}
          >
            <Checkbox
              id={`apt-${apt.id}`}
              checked={selectedIds.has(apt.id)}
              onCheckedChange={() => onToggleApartment(apt.id)}
              className="mt-0.5"
            />
            <div className="flex-1 text-sm">
              <p className="font-medium">
                {apt.building ? `Budynek ${apt.building}, ` : ''}
                Mieszkanie {apt.number}
              </p>
              <p className="text-muted-foreground">
                {apt.owner && `${apt.owner} · `}
                {apt.email}
              </p>
            </div>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
