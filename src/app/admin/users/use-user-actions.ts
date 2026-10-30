'use client';

import { useCallback, useState } from 'react';

import { createEmptyNewUserData } from '@/app/admin/users/constants';
import type { EditMode, NewUserFormData } from '@/app/admin/users/types';
import {
  createUserRequest,
  updateUserRequest,
} from '@/app/admin/users/user-requests';
import { useConfirm } from '@/components/providers/confirm-dialog';
import { CREDENTIALS_REQUIRED_MESSAGE } from '@/lib/auth/credential-validation';
import { AccountStatus } from '@/lib/types';
import type { UserDto } from '@/lib/types/dto/user-dto';

/** Dialog state and mutations of the admin users page. */
export function useUserActions(refresh: () => Promise<void>) {
  const confirm = useConfirm();
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [selectedApartments, setSelectedApartments] = useState<string[]>([]);
  const [apartmentSearch, setApartmentSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [newUserData, setNewUserData] = useState<NewUserFormData>(
    createEmptyNewUserData()
  );

  const closeDialog = useCallback(() => {
    setSelectedUser(null);
    setSelectedApartments([]);
    setApartmentSearch('');
    setEditMode(null);
  }, []);

  const openUserDialog = useCallback((user: UserDto, mode: EditMode) => {
    setSelectedUser(user);
    setSelectedApartments(
      user.apartments?.map((apartment) => apartment.id) || []
    );
    setEditMode(mode);
  }, []);

  const openCreateDialog = useCallback(() => {
    setNewUserData(createEmptyNewUserData());
    setEditMode('create-user');
  }, []);

  const closeCreateDialog = useCallback(() => {
    setEditMode(null);
    setNewUserData(createEmptyNewUserData());
  }, []);

  const handleUpdateUser = useCallback(
    async (userId: string, status: AccountStatus, apartmentIds?: string[]) => {
      setActionLoading(true);
      const error = await updateUserRequest({ userId, status, apartmentIds });
      if (error) {
        alert(error);
      } else {
        await refresh();
        closeDialog();
      }
      setActionLoading(false);
    },
    [closeDialog, refresh]
  );

  const handleCreateUser = useCallback(async () => {
    if (!newUserData.email || !newUserData.password) {
      alert(CREDENTIALS_REQUIRED_MESSAGE);
      return;
    }

    setActionLoading(true);
    const error = await createUserRequest(newUserData);
    if (error) {
      alert(error);
    } else {
      await refresh();
      closeCreateDialog();
    }
    setActionLoading(false);
  }, [closeCreateDialog, newUserData, refresh]);

  const handleRejectFromStatusDialog = useCallback(async () => {
    if (!selectedUser) {
      return;
    }

    if (selectedUser.apartments && selectedUser.apartments.length > 0) {
      const confirmed = await confirm({
        title: 'Odrzuć użytkownika',
        description:
          'Odrzucenie użytkownika usunie przypisanie mieszkań. Kontynuować?',
        confirmText: 'Odrzuć',
        cancelText: 'Anuluj',
        variant: 'destructive',
      });

      if (!confirmed) {
        return;
      }
    }

    await handleUpdateUser(selectedUser.id, AccountStatus.REJECTED);
  }, [confirm, handleUpdateUser, selectedUser]);

  return {
    selectedUser,
    selectedApartments,
    setSelectedApartments,
    apartmentSearch,
    setApartmentSearch,
    actionLoading,
    editMode,
    newUserData,
    setNewUserData,
    closeDialog,
    openUserDialog,
    openCreateDialog,
    closeCreateDialog,
    handleUpdateUser,
    handleCreateUser,
    handleRejectFromStatusDialog,
  };
}
