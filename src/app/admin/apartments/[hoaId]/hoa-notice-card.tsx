'use client';

import { ChevronDown } from 'lucide-react';

import { HoaNotice } from '@/components/dashboard/hoa-notice';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface HoaNoticeCardProps {
  header: string | null;
  footer: string | null;
}

const NOTICE_WRAPPER_CLASS =
  'overflow-hidden rounded-md border [&>[role=note]]:border-t-0';

export function NoticeSection({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  return (
    <section className="space-y-1">
      <h3 className="text-sm font-medium">{label}</h3>
      <div className={NOTICE_WRAPPER_CLASS}>
        <HoaNotice text={text} />
      </div>
    </section>
  );
}

export function HoaNoticeCard({ header, footer }: HoaNoticeCardProps) {
  if (!header && !footer) {
    return null;
  }

  return (
    <Card className="mb-6">
      <Collapsible>
        <CardHeader>
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 text-left transition-opacity hover:opacity-70 [&[data-state=open]>svg]:rotate-180">
            <div className="space-y-1.5">
              <CardTitle>Nagłówek i stopka powiadomień</CardTitle>
              <CardDescription>
                Teksty z pliku powiadomień, wyświetlane najemcom przy
                naliczeniach
              </CardDescription>
            </div>
            <ChevronDown
              aria-hidden
              className="h-5 w-5 shrink-0 transition-transform duration-200"
            />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {header && <NoticeSection label="Nagłówek" text={header} />}
            {footer && <NoticeSection label="Stopka" text={footer} />}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
