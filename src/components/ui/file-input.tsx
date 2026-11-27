'use client';

import type { ComponentProps, InputHTMLAttributes } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/shared/utils';

const DIRECTORY_ATTRIBUTES = {
  webkitdirectory: '',
  directory: '',
} as InputHTMLAttributes<HTMLInputElement>;

const FILE_LABELS = { button: 'Wybierz pliki', empty: 'Nie wybrano plików' };
const FOLDER_LABELS = {
  button: 'Wybierz folder',
  empty: 'Nie wybrano folderu',
};

interface Props extends Omit<ComponentProps<'input'>, 'type' | 'title'> {
  id: string;
  /** The selection the caller holds, which is what the input describes. */
  files: ArrayLike<File> | null;
  /** Picks a whole folder instead of single files. */
  directory?: boolean;
}

function describeSelection(files: ArrayLike<File>, directory: boolean) {
  const count = `Wybrano plików: ${files.length}`;
  if (!directory) return files.length === 1 ? files[0].name : count;

  const folder = files[0].webkitRelativePath?.split('/')[0];
  return folder ? `${folder} · plików: ${files.length}` : count;
}

/**
 * File input with Polish texts. The browser draws the native control in its own
 * language, so it stays transparent on top and keeps clicks, drops and focus.
 */
export function FileInput({
  id,
  files,
  directory = false,
  className,
  ...props
}: Props) {
  const labels = directory ? FOLDER_LABELS : FILE_LABELS;
  const status = files?.length
    ? describeSelection(files, directory)
    : labels.empty;
  const statusId = `${id}-selection`;

  return (
    <div className={cn('relative', className)}>
      <input
        {...props}
        {...(directory ? DIRECTORY_ATTRIBUTES : {})}
        id={id}
        type="file"
        // An empty title hides the browser's own tooltip
        title=""
        aria-describedby={statusId}
        className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <div className="flex h-10 items-center gap-3 rounded-md border border-input px-1 shadow-sm transition-all duration-200 peer-hover:bg-accent/40 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:opacity-50">
        <span
          aria-hidden="true"
          className={buttonVariants({ variant: 'secondary', size: 'sm' })}
        >
          {labels.button}
        </span>
        <span
          key={status}
          id={statusId}
          className="min-w-0 truncate text-sm text-muted-foreground motion-safe:animate-fade-in"
        >
          {status}
        </span>
      </div>
    </div>
  );
}
