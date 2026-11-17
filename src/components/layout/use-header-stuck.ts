'use client';

import { useEffect, useRef, useState } from 'react';

const NAVBAR_HEIGHT_PX = 65;
const RESTING_HEIGHT_SETTLE_MS = 250;

export function useHeaderStuck() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stuckRef = useRef(false);
  const [isStuck, setIsStuck] = useState(false);
  const [restingHeight, setRestingHeight] = useState<number>();

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const stuck =
          !entry.isIntersecting &&
          entry.boundingClientRect.top < NAVBAR_HEIGHT_PX;
        stuckRef.current = stuck;
        setIsStuck(stuck);
      },
      { rootMargin: `-${NAVBAR_HEIGHT_PX}px 0px 0px 0px` }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === 'undefined') return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const measure = () => {
      if (!stuckRef.current) setRestingHeight(content.offsetHeight);
    };
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(measure, RESTING_HEIGHT_SETTLE_MS);
    });
    observer.observe(content);
    measure();
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return { sentinelRef, contentRef, isStuck, restingHeight } as const;
}
