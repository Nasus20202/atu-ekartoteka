'use client';

import { Check, Clock, ShieldCheck, Users, X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { AccountStatus } from '@/lib/types';

export type UserFilter = 'ALL' | 'ADMINS' | AccountStatus;

interface UserFiltersProps {
  filter: UserFilter;
  onChange: (filter: UserFilter) => void;
  action?: ReactNode;
}

export function UserFilters({ filter, onChange, action }: UserFiltersProps) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="grid grid-cols-2 gap-2 sm:contents">
        <Button
          variant={filter === 'ALL' ? 'default' : 'outline'}
          onClick={() => onChange('ALL')}
          size="sm"
          className="col-span-2 sm:col-span-1"
        >
          <Users className="mr-1 h-4 w-4" />
          Wszyscy
        </Button>
        <Button
          variant={filter === AccountStatus.PENDING ? 'default' : 'outline'}
          onClick={() => onChange(AccountStatus.PENDING)}
          size="sm"
        >
          <Clock className="mr-1 h-4 w-4" />
          Oczekujące
        </Button>
        <Button
          variant={filter === AccountStatus.APPROVED ? 'default' : 'outline'}
          onClick={() => onChange(AccountStatus.APPROVED)}
          size="sm"
        >
          <Check className="mr-1 h-4 w-4" />
          Zatwierdzone
        </Button>
        <Button
          variant={filter === AccountStatus.REJECTED ? 'default' : 'outline'}
          onClick={() => onChange(AccountStatus.REJECTED)}
          size="sm"
        >
          <X className="mr-1 h-4 w-4" />
          Odrzucone
        </Button>
        <Button
          variant={filter === 'ADMINS' ? 'default' : 'outline'}
          onClick={() => onChange('ADMINS')}
          size="sm"
        >
          <ShieldCheck className="mr-1 h-4 w-4" />
          Administratorzy
        </Button>
      </div>
      {action && <div className="flex justify-end sm:ml-auto">{action}</div>}
    </div>
  );
}
