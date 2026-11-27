'use client';

import { Check, ChevronDown, Search } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useListboxNavigation } from '@/components/ui/use-listbox-navigation';
import { cn } from '@/lib/shared/utils';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  id?: string;
  value: string;
  /** Label of the chosen value, which a search may leave out of the options */
  selectedLabel: string | null;
  /** The options that match `search`; the caller does the matching */
  options: ComboboxOption[];
  search: string;
  /** The options do not match `search` yet, so Enter chooses none of them */
  busy?: boolean;
  onSearchChange: (search: string) => void;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchLabel: string;
  listLabel: string;
  emptyMessage: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/** A select whose options are narrowed by typing. */
export function Combobox({
  value,
  selectedLabel,
  options,
  search,
  busy = false,
  onSearchChange,
  onValueChange,
  placeholder,
  searchLabel,
  listLabel,
  emptyMessage,
  className,
  ...triggerProps
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const valueId = useId();

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) onSearchChange('');
  };
  const choose = (next: string) => {
    onValueChange(next);
    changeOpen(false);
  };
  const list = useListboxNavigation(options, value, (next) => {
    if (!busy) choose(next);
  });

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-describedby={valueId}
          className={cn(
            'w-full justify-between text-left font-normal data-[state=open]:[&_svg]:rotate-180',
            selectedLabel === null && 'text-muted-foreground',
            className
          )}
          {...triggerProps}
        >
          <span id={valueId} className="truncate">
            {selectedLabel ?? placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 ease-out" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-56 p-0 [--tw-enter-scale:1]! [--tw-exit-scale:1]!">
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
          <input
            role="combobox"
            aria-label={searchLabel}
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={
              list.activeIndex >= 0
                ? `${listId}-${list.activeIndex}`
                : undefined
            }
            autoComplete="off"
            className="h-10 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
            placeholder={searchLabel}
            value={search}
            onChange={(event) => {
              list.reset();
              onSearchChange(event.target.value);
            }}
            onKeyDown={list.onKeyDown}
          />
        </div>
        <ul
          id={listId}
          role="listbox"
          aria-label={listLabel}
          aria-busy={busy}
          className="max-h-60 overflow-y-auto p-1"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              ref={index === list.activeIndex ? list.scrollIntoView : undefined}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm',
                index === list.activeIndex && 'bg-accent text-accent-foreground'
              )}
              onPointerMove={() => list.activate(index)}
              onClick={() => choose(option.value)}
            >
              <Check
                className={cn(
                  'h-4 w-4 shrink-0',
                  option.value !== value && 'invisible'
                )}
                aria-hidden
              />
              <span className="truncate">{option.label}</span>
            </li>
          ))}
        </ul>
        {options.length === 0 && (
          <p
            role="status"
            className="px-3 pb-3 text-center text-sm text-muted-foreground"
          >
            {emptyMessage}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
