'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      Wyloguj
    </Button>
  );
}
