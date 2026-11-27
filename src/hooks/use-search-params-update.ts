'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Puts values into the address, keeping the other parameters; an empty or null
 * value removes its parameter. The page is not scrolled.
 */
export function useSearchParamsUpdate() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = (values: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [name, value] of Object.entries(values)) {
      if (value) next.set(name, value);
      else next.delete(name);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return { update } as const;
}
