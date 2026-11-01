'use client';

import { useEffect, useState } from 'react';

import { NoticeSection } from '@/app/admin/apartments/[hoaId]/hoa-notice-card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface HoaNoticeItem {
  id: string;
  externalId: string;
  name: string;
  header: string | null;
  footer: string | null;
}

interface HoaNoticesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LOAD_ERROR_MESSAGE = 'Nie udało się pobrać nagłówków i stopek.';

function HoaNoticeEntry({ hoa }: { hoa: HoaNoticeItem }) {
  return (
    <section className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
      <h3 className="text-sm font-medium">
        {hoa.name}{' '}
        <span className="font-mono text-xs font-normal text-muted-foreground">
          {hoa.externalId}
        </span>
      </h3>
      {hoa.header && <NoticeSection label="Nagłówek" text={hoa.header} />}
      {hoa.footer && <NoticeSection label="Stopka" text={hoa.footer} />}
      {!hoa.header && !hoa.footer && (
        <p className="text-xs text-muted-foreground">Brak nagłówka i stopki</p>
      )}
    </section>
  );
}

export function HoaNoticesDialog({
  open,
  onOpenChange,
}: HoaNoticesDialogProps) {
  const [hoas, setHoas] = useState<HoaNoticeItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadNotices() {
      try {
        const response = await fetch('/api/admin/hoa/notices');
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        if (!cancelled) {
          setHoas(data.homeownersAssociations);
          setError(null);
        }
      } catch (fetchError) {
        console.error('Failed to fetch HOA notices:', fetchError);
        if (!cancelled) {
          setError(LOAD_ERROR_MESSAGE);
        }
      }
    }

    void loadNotices();

    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl gap-4 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nagłówki i stopki powiadomień</DialogTitle>
          <DialogDescription>
            Teksty z plików powiadomień wszystkich wspólnot
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!error && hoas === null && (
          <p role="status" className="text-sm text-muted-foreground">
            Ładowanie...
          </p>
        )}
        <div className="space-y-4">
          {hoas?.map((hoa) => (
            <HoaNoticeEntry key={hoa.id} hoa={hoa} />
          ))}
        </div>
        {hoas?.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Nie znaleziono wspólnot mieszkaniowych
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button>Zamknij</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
