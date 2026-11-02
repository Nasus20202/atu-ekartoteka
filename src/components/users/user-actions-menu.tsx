'use client';

import { UserPlus, Users } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function UserActionsMenu({
  onCreateUser,
}: {
  onCreateUser: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Akcje
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onCreateUser}>
          <UserPlus className="mr-2 h-4 w-4" />
          Dodaj użytkownika
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/users/management">
            <Users className="mr-2 h-4 w-4" />
            Zarządzanie kontami
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
