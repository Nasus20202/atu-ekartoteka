'use client';

import { useCallback, useEffect, useState } from 'react';

import type { UserFilter } from '@/components/users/user-filters';
import { buildUsersQuery } from '@/components/users/utils';
import {
  type InfinitePage,
  type PageFetcher,
  useInfiniteList,
} from '@/hooks/use-infinite-list';
import { AccountStatus } from '@/lib/types';
import type { UserDto } from '@/lib/types/dto/user-dto';
import type { SortState, UserSortKey } from '@/lib/utils/sort';

const SEARCH_DEBOUNCE_MS = 300;

const getUserId = (user: UserDto) => user.id;

/**
 * Infinitely scrolled, filtered and debounced-search list of users.
 * `initialPage` is the first page of the default filter, loaded on the server.
 */
export function useAdminUsers(initialPage?: InfinitePage<UserDto>) {
  const [filter, setFilter] = useState<UserFilter>(AccountStatus.PENDING);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortState<UserSortKey> | null>(null);

  const fetchPage = useCallback<PageFetcher<UserDto>>(
    async (page, signal) => {
      const query = buildUsersQuery(filter, page, debouncedSearch, sort);
      const response = await fetch(`/api/admin/users?${query}`, { signal });
      if (!response.ok) {
        throw new Error(`Users request failed: ${response.status}`);
      }
      const data = await response.json();
      return {
        items: data.users,
        page,
        totalPages: data.pagination.totalPages,
        total: data.pagination.total,
      };
    },
    [debouncedSearch, filter, sort]
  );

  const list = useInfiniteList({
    fetchPage,
    queryKey: `${filter}|${debouncedSearch}|${sort?.key ?? ''}|${sort?.direction ?? ''}`,
    getId: getUserId,
    initialPage,
  });

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(userSearch),
      SEARCH_DEBOUNCE_MS
    );

    return () => clearTimeout(timer);
  }, [userSearch]);

  return {
    ...list,
    users: list.items,
    filter,
    setFilter,
    userSearch,
    setUserSearch,
    sort,
    setSort,
  };
}
