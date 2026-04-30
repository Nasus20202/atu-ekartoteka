'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface ChartSize {
  width: number;
  height: number;
}

interface MeasuredChartProps {
  className?: string;
  'data-testid'?: string;
  children: (size: ChartSize) => React.ReactNode;
}

export function MeasuredChart({
  className,
  children,
  'data-testid': dataTestId,
}: MeasuredChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ChartSize>({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      const { width, height } = element.getBoundingClientRect();

      setSize((current) => {
        if (current.width === width && current.height === height) {
          return current;
        }

        return { width, height };
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const hasSize = size.width > 0 && size.height > 0;

  return (
    <div
      ref={containerRef}
      className={cn('min-w-0', className)}
      data-testid={dataTestId}
    >
      {hasSize ? children(size) : null}
    </div>
  );
}
