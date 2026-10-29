'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { UserFilter } from '@/app/admin/users/user-filters';
import { buildUsersQuery } from '@/app/admin/users/utils';
import { AccountStatus } from '@/lib/types';
import type { UserDto } from '@/lib/types/dto/user-dto';

const SEARCH_DEBOUNCE_MS = 300;

/** Paged, filtered and debounced-search list of users for the admin page. */
export function useAdminUsers() {
  const latestUsersRequestId = useRef(0);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<UserFilter>(AccountStatus.PENDING);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    const requestId = ++latestUsersRequestId.current;
    setLoading(true);

    try {
      const query = buildUsersQuery(filter, page, debouncedSearch);
      const response = await fetch(`/api/admin/users?${query}`);
      const data = await response.json();

      if (response.ok && requestId === latestUsersRequestId.current) {
        setUsers(data.users);
        setTotalPages(data.pagination?.totalPages ?? 1);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      if (requestId === latestUsersRequestId.current) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, filter, page]);

  useEffect(() => {
    async function loadUsers() {
      await fetchUsers();
    }

    void loadUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(userSearch);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [userSearch]);

  return {
    users,
    loading,
    filter,
    setFilter,
    page,
    setPage,
    totalPages,
    userSearch,
    setUserSearch,
    fetchUsers,
  };
}
