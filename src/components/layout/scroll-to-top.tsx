'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect } from 'react';

/**
 * Layouts persist across navigations, and Next.js skips its own scroll reset
 * when the new page's first element is already in the viewport, which leaves
 * the page partially scrolled under the sticky header.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
