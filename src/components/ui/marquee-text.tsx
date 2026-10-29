'use client';

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/utils';

const FADE_PX = 16;
const SCROLL_SPEED_PX_PER_S = 40;
// Share of the animation cycle spent moving in one direction (see marquee-scroll)
const SCROLL_SHARE_OF_CYCLE = 0.25;
const MIN_CYCLE_S = 8;

interface MarqueeTextProps {
  children: ReactNode;
  className?: string;
}

/**
 * Single-line text that, when it does not fit, scrolls to its end and back
 * with faded edges. Falls back to static faded text for reduced motion.
 */
export function MarqueeText({ children, className }: MarqueeTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;

    if (!container || !text) {
      return;
    }

    const measure = () => {
      const available = container.clientWidth - 2 * FADE_PX;
      setOverflow(Math.max(0, Math.ceil(text.scrollWidth - available)));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const isOverflowing = overflow > 0;
  const cycleSeconds = Math.max(
    MIN_CYCLE_S,
    overflow / SCROLL_SPEED_PX_PER_S / SCROLL_SHARE_OF_CYCLE
  );

  return (
    <span
      ref={containerRef}
      className={cn(
        'block overflow-hidden whitespace-nowrap',
        isOverflowing && 'mask-fade-x',
        className
      )}
      // The left fade sits in a negative margin, so text stays aligned
      style={
        {
          marginLeft: -FADE_PX,
          paddingInline: FADE_PX,
          '--marquee-fade': `${FADE_PX}px`,
        } as CSSProperties
      }
    >
      <span
        ref={textRef}
        className={cn('inline-block', isOverflowing && 'animate-marquee')}
        style={
          isOverflowing
            ? ({
                '--marquee-distance': `-${overflow}px`,
                '--marquee-duration': `${cycleSeconds}s`,
              } as CSSProperties)
            : undefined
        }
      >
        {children}
      </span>
    </span>
  );
}
