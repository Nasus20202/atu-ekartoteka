'use client';

import { FileText } from 'lucide-react';
import { useState } from 'react';

import { HoaNoticesDialog } from '@/components/apartments/hoa-notices-dialog';
import { Button } from '@/components/ui/button';

export function HoaNoticesButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <FileText className="mr-2 h-4 w-4" />
        Nagłówki i stopki
      </Button>
      <HoaNoticesDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
