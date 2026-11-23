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
    if (!sentinel) return;

    const apply = (stuck: boolean) => {
      if (stuck === stuckRef.current) return;
      stuckRef.current = stuck;
      setIsStuck(stuck);
    };

    // The observer only reports crossings of the navbar edge. WebKit can miss
    // the way back when the page scrolls twice in quick succession, so every
    // scroll also measures the sentinel and keeps the state in sync.
    const measure = () =>
      apply(sentinel.getBoundingClientRect().top < NAVBAR_HEIGHT_PX);

    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) =>
          apply(
            !entry.isIntersecting &&
              entry.boundingClientRect.top < NAVBAR_HEIGHT_PX
          ),
        { rootMargin: `-${NAVBAR_HEIGHT_PX}px 0px 0px 0px` }
      );
      observer.observe(sentinel);
    }

    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
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
