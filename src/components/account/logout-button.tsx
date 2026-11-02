'use client';

import { LogOut } from 'lucide-react';

import { useLogout } from '@/components/account/use-logout';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const { logout, pending } = useLogout();

  return (
    <Button variant="ghost" size="sm" onClick={logout} disabled={pending}>
      <LogOut className="mr-2 h-4 w-4" />
      Wyloguj
    </Button>
  );
}
