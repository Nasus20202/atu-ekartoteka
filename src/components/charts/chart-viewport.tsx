'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

export const CHART_VIEWPORT_SIZE = 12;

type LabeledDatum = { label: string };

export function useChartViewport<T extends LabeledDatum>(data: T[]) {
  const maxOffset = Math.max(data.length - CHART_VIEWPORT_SIZE, 0);
  const [offset, setOffset] = useState(maxOffset);

  const visibleData = useMemo(
    () => data.slice(offset, offset + CHART_VIEWPORT_SIZE),
    [data, offset]
  );

  return {
    visibleData,
    canGoBack: offset > 0,
    canGoForward: offset < maxOffset,
    goBack: () => setOffset((current) => Math.max(current - 1, 0)),
    goForward: () => setOffset((current) => Math.min(current + 1, maxOffset)),
  };
}

interface ChartViewportNavProps {
  firstLabel?: string;
  lastLabel?: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
}

export function ChartViewportNav({
  firstLabel,
  lastLabel,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
}: ChartViewportNavProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground">
        Pokazano {firstLabel} - {lastLabel}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onBack}
          disabled={!canGoBack}
          aria-label="Pokaż wcześniejsze miesiące"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onForward}
          disabled={!canGoForward}
          aria-label="Pokaż nowsze miesiące"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
