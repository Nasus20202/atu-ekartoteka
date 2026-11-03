import { cookies } from 'next/headers';

import {
  listViewCookieName,
  type ListViewMode,
  parseListViewMode,
} from '@/lib/list-view-mode';

/** The list view the user last chose, so the server renders it, not the default. */
export async function getListViewMode(
  storageKey: string
): Promise<ListViewMode> {
  const cookieStore = await cookies();

  return parseListViewMode(
    cookieStore.get(listViewCookieName(storageKey))?.value
  );
}
