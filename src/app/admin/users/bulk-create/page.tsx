'use client';

import { CheckCircle, UserPlus, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Page } from '@/components/page';
import { PageHeader } from '@/components/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApartmentCount } from '@/components/ui/apartment-count';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingCard } from '@/components/ui/loading-card';

interface UnassignedApartment {
  id: string;
  number: string;
  building: string | null;
  owner: string | null;
  email: string;
}

interface HoaGroup {
  hoaId: string;
  hoaName: string;
  apartments: UnassignedApartment[];
}

interface BulkCreateResult {
  created: number;
  skipped: number;
  errors: number;
}

export default function BulkCreateUsersPage() {
  const [hoas, setHoas] = useState<HoaGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkCreateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUnassigned = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/unassigned-apartments');
      const data = await res.json();
      if (res.ok) {
        setHoas(data.hoas);
      } else {
        setError(data.error || 'Nie udało się pobrać listy mieszkań');
      }
    } catch {
      setError('Nie udało się pobrać listy mieszkań');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnassigned();
  }, []);

  const allApartmentIds = hoas.flatMap((h) => h.apartments.map((a) => a.id));

  const isHoaSelected = (hoa: HoaGroup) =>
    hoa.apartments.every((a) => selectedIds.has(a.id));

  const isHoaIndeterminate = (hoa: HoaGroup) =>
    hoa.apartments.some((a) => selectedIds.has(a.id)) && !isHoaSelected(hoa);

  const toggleHoa = (hoa: HoaGroup) => {
    const next = new Set(selectedIds);
    if (isHoaSelected(hoa)) {
      hoa.apartments.forEach((a) => next.delete(a.id));
    } else {
      hoa.apartments.forEach((a) => next.add(a.id));
    }
    setSelectedIds(next);
  };

  const toggleApartment = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/users/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apartmentIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setSelectedIds(new Set());
        await fetchUnassigned();
      } else {
        setError(data.error || 'Wystąpił błąd podczas tworzenia kont');
      }
    } catch {
      setError('Wystąpił błąd podczas tworzenia kont');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page maxWidth="4xl">
      <div className="mb-6 flex items-center justify-between">
        <PageHeader
          title="Utwórz wiele kont"
          description="Wybierz mieszkania, dla których chcesz utworzyć konta użytkowników"
          showBackButton={false}
        />
        <Button variant="outline" asChild>
          <Link href="/admin/users">Powrót</Link>
        </Button>
      </div>

      {result && (
        <Alert className="mb-4 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Utworzono {result.created} kont. Pominięto {result.skipped}.
            {result.errors > 0 && ` Błędy: ${result.errors}.`}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <LoadingCard />
      ) : allApartmentIds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Brak mieszkań bez kont</p>
            <p className="text-sm text-muted-foreground">
              Wszystkie mieszkania mają już przypisane konta użytkowników.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Wybrano {selectedIds.size} z {allApartmentIds.length} mieszkań
            </p>
            <Button
              onClick={handleSubmit}
              disabled={selectedIds.size === 0 || submitting}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {submitting ? 'Tworzenie...' : 'Utwórz konta'}
            </Button>
          </div>

          <div className="space-y-4">
            {hoas.map((hoa) => (
              <HoaCard
                key={hoa.hoaId}
                hoa={hoa}
                selectedIds={selectedIds}
                isHoaSelected={isHoaSelected(hoa)}
                isHoaIndeterminate={isHoaIndeterminate(hoa)}
                onToggleHoa={() => toggleHoa(hoa)}
                onToggleApartment={toggleApartment}
              />
            ))}
          </div>
        </>
      )}
    </Page>
  );
}

interface HoaCardProps {
  hoa: HoaGroup;
  selectedIds: Set<string>;
  isHoaSelected: boolean;
  isHoaIndeterminate: boolean;
  onToggleHoa: () => void;
  onToggleApartment: (id: string) => void;
}

function HoaCard({
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
