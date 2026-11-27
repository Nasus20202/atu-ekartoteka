'use client';

import type { ReactNode } from 'react';

import { ViewTransition } from '@/components/ui/view-transition';
import { useMediaQuery } from '@/hooks/use-media-query';

const TABLE_VIEW = 'table';
const LIST_VIEW = 'list';

interface Props {
  /** Media query above which the table is shown instead of the list. */
  tableQuery: string;
  table: ReactNode;
  list: ReactNode;
}

/**
 * Shows one layout for the viewport: a table on wide screens, a stacked list on
 * narrow ones. Only the chosen layout is rendered, so its content is never
 * duplicated for assistive technology, and a resize animates the switch.
 */
export function ResponsiveStatsView({ tableQuery, table, list }: Props) {
  const wide = useMediaQuery(tableQuery);

  return (
    <ViewTransition view={wide ? TABLE_VIEW : LIST_VIEW}>
      {wide ? table : list}
    </ViewTransition>
  );
}
