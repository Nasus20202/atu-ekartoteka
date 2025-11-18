'use client';

import { Check, ChevronDown, Clock, Mail, User, X } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AccountStatus } from '@/lib/types';

interface UserStatusSectionProps {
  name: string | null;
  email: string;
  status: string;
}

const statusMap = {
  APPROVED: 'Zatwierdzony',
  PENDING: 'Oczekujący',
  REJECTED: 'Odrzucony',
};

export function UserStatusSection({
  name,
  email,
  status,
}: UserStatusSectionProps) {
  const isApproved = status === AccountStatus.APPROVED;

  return (
    <Card className="animate-scale-in">
      <Collapsible defaultOpen={!isApproved}>
        <CardHeader>
          <CollapsibleTrigger className="flex w-full items-center justify-between hover:opacity-70 transition-opacity [&[data-state=open]>svg]:rotate-180">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Status konta
            </CardTitle>
            <ChevronDown className="h-5 w-5 transition-transform duration-200" />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Status zatwierdzenia
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {status === AccountStatus.APPROVED && (
                    <>
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {statusMap[status as keyof typeof statusMap]}
                      </span>
                    </>
                  )}
                  {status === AccountStatus.PENDING && (
                    <>
                      <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="font-medium text-yellow-600 dark:text-yellow-400">
                        {statusMap[status as keyof typeof statusMap]}
                      </span>
                    </>
                  )}
                  {status === AccountStatus.REJECTED && (
                    <>
                      <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {statusMap[status as keyof typeof statusMap]}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {status === AccountStatus.PENDING && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-200">
                      Konto oczekuje na zatwierdzenie
                    </p>
                    <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-300">
                      Twoje konto zostanie sprawdzone przez administratora. Po
                      zatwierdzeniu otrzymasz dostęp do pełnej funkcjonalności
                      systemu.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {status === AccountStatus.REJECTED && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
                <div className="flex items-start gap-3">
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-200">
                      Konto zostało odrzucone
                    </p>
                    <p className="mt-1 text-sm text-red-800 dark:text-red-300">
                      Skontaktuj się z administratorem, aby uzyskać więcej
                      informacji.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{email}</span>
              </div>
              {name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Imię i nazwisko:
                  </span>
                  <span className="font-medium">{name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
