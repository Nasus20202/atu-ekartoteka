'use client';

import useSWR from 'swr';

import { NoticeSection } from '@/components/apartments/hoa-notice-card';
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
import { fetchJson } from '@/lib/swr/fetch-json';
import { SWR_OPTIONS } from '@/lib/swr/swr-options';

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

const NOTICES_URL = '/api/admin/hoa/notices';
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
  const { data, error: loadError } = useSWR<{
    homeownersAssociations: HoaNoticeItem[];
  }>(open ? NOTICES_URL : null, fetchJson, SWR_OPTIONS);
  const hoas = data?.homeownersAssociations ?? null;
  const error = loadError ? LOAD_ERROR_MESSAGE : null;

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
