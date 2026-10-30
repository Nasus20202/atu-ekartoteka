import { CheckCircle } from 'lucide-react';

import { HoaCard, HoaGroup } from '@/app/admin/users/management/hoa-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InfiniteScrollSentinel } from '@/components/ui/infinite-scroll-sentinel';
import { LoadingCard } from '@/components/ui/loading-card';

interface ApartmentListProps {
  loading: boolean;
  hoas: HoaGroup[];
  hasMore: boolean;
  loadingMore: boolean;
  loadError: string | null;
  onLoadMore: () => void;
  allIds: string[];
  selectedIds: Set<string>;
  submitting: boolean;
  isHoaSelected: (hoa: HoaGroup) => boolean;
  isHoaIndeterminate: (hoa: HoaGroup) => boolean;
  onToggleHoa: (hoa: HoaGroup) => void;
  onToggleApartment: (id: string) => void;
  onSelectIds: (ids: string[], checked: boolean) => void;
  emptyMessage: { text: string; sub: string };
  submitLabel: string;
  onSubmit: () => void;
  submitIcon: React.ReactNode;
}

export function ApartmentList({
  loading,
  hoas,
  hasMore,
  loadingMore,
  loadError,
  onLoadMore,
  allIds,
  selectedIds,
  submitting,
  isHoaSelected,
  isHoaIndeterminate,
  onToggleHoa,
  onToggleApartment,
  onSelectIds,
  emptyMessage,
  submitLabel,
  onSubmit,
  submitIcon,
}: ApartmentListProps) {
  if (loading) return <LoadingCard />;

  const sentinel = (
    <InfiniteScrollSentinel
      hasMore={hasMore}
      loading={loadingMore}
      error={loadError}
      onLoadMore={onLoadMore}
    />
  );

  if (loadError && hoas.length === 0) return sentinel;

  if (allIds.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">{emptyMessage.text}</p>
          <p className="text-sm text-muted-foreground">{emptyMessage.sub}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Wybrano {selectedIds.size} z {allIds.length} mieszkań
        </p>
        <Button
          onClick={onSubmit}
          disabled={selectedIds.size === 0 || submitting}
          className="shrink-0"
        >
          {submitIcon}
          {submitLabel}
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
            onToggleHoa={() => onToggleHoa(hoa)}
            onToggleApartment={onToggleApartment}
            onSelectIds={onSelectIds}
          />
        ))}
      </div>

      {sentinel}
    </>
  );
}
