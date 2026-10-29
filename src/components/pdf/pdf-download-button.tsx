'use client';

import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const BUTTON_TEXT = 'Pobierz PDF';
const LOADING_TEXT = 'Generowanie...';

export interface PdfFile {
  blob: Blob;
  fileName: string;
}

interface PdfDownloadButtonProps {
  /** Accessible name of the icon-only button, e.g. what the PDF covers */
  label: string;
  /** Icon-only button for list rows */
  compact?: boolean;
  createPdf: () => Promise<PdfFile>;
}

function saveFile({ blob, fileName }: PdfFile) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function PdfDownloadButton({
  label,
  compact = false,
  createPdf,
}: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      saveFile(await createPdf());
    } finally {
      setLoading(false);
    }
  };

  const Icon = loading ? Loader2 : FileDown;
  const iconClassName = cn('h-4 w-4', loading && 'animate-spin');

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        // Pulls the icon to the row edge, in line with the chevrons above
        className="-mr-3 h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={handleDownload}
        disabled={loading}
        aria-label={loading ? LOADING_TEXT : label}
        title={BUTTON_TEXT}
      >
        <Icon className={iconClassName} />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
    >
      <Icon className={cn(iconClassName, 'mr-2')} />
      {loading ? LOADING_TEXT : BUTTON_TEXT}
    </Button>
  );
}
