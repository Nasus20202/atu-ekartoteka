'use client';

import { Loader2, XCircle } from 'lucide-react';
import { useEffect, useEffectEvent, useRef } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const PREFETCH_MARGIN = '200px';

interface InfiniteScrollSentinelProps {
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
}

/** Loads the next page when scrolled into view, with a manual fallback. */
export function InfiniteScrollSentinel({
  hasMore,
  loading,
  error,
  onLoadMore,
}: InfiniteScrollSentinelProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const autoLoad = hasMore && !loading && !error;
  const handleVisible = useEffectEvent(onLoadMore);

  useEffect(() => {
    const target = targetRef.current;
    if (!autoLoad || !target || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) handleVisible();
      },
      { rootMargin: PREFETCH_MARGIN }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [autoLoad]);

  if (!hasMore && !loading && !error) return null;

  return (
    <div
      ref={targetRef}
      className="mt-6 flex flex-col items-center gap-3"
      data-testid="infinite-scroll-sentinel"
    >
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div aria-live="polite">
        {loading ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Ładowanie...
          </span>
        ) : (
          hasMore && (
            <Button variant="outline" size="sm" onClick={onLoadMore}>
              Pokaż więcej
            </Button>
          )
        )}
      </div>
    </div>
  );
}
