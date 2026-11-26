'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef } from 'react';

/**
 * Layouts persist across navigations, and Next.js skips its own scroll reset
 * when the new page's first element is already in the viewport, which leaves
 * the page partially scrolled under the sticky header.
 *
 * The first run is the mount, which happens during hydration. The browser
 * owns the scroll position then, so it is left alone: resetting it would send
 * a user who scrolled while the page was loading back to the top.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const renderedPathname = useRef<string | undefined>(undefined);

  useLayoutEffect(() => {
    const previous = renderedPathname.current;
    renderedPathname.current = pathname;
    if (previous === undefined || previous === pathname) return;
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
