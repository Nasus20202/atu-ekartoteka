'use client';

import { useCallback, useEffect, useState } from 'react';

import type { UserFilter } from '@/app/admin/users/user-filters';
import { buildUsersQuery } from '@/app/admin/users/utils';
import {
  type PageFetcher,
  useInfiniteList,
} from '@/lib/hooks/use-infinite-list';
import { AccountStatus } from '@/lib/types';
import type { UserDto } from '@/lib/types/dto/user-dto';

const SEARCH_DEBOUNCE_MS = 300;

const getUserId = (user: UserDto) => user.id;

/** Infinitely scrolled, filtered and debounced-search list of users. */
export function useAdminUsers() {
  const [filter, setFilter] = useState<UserFilter>(AccountStatus.PENDING);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const fetchPage = useCallback<PageFetcher<UserDto>>(
    async (page, signal) => {
      const query = buildUsersQuery(filter, page, debouncedSearch);
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
    [debouncedSearch, filter]
  );

  const list = useInfiniteList({
    fetchPage,
    queryKey: `${filter}|${debouncedSearch}`,
    getId: getUserId,
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
  };
}
