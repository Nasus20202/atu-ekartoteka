'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type SelectOption<T extends string = string> = {
  label: string;
  value: T;
  disabled?: boolean;
};

type SelectProps<T extends string = string> = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'defaultValue' | 'onChange' | 'value'
> & {
  value: T;
  options: readonly SelectOption<T>[];
  onValueChange: (value: T) => void;
  placeholder?: string;
  contentClassName?: string;
};

function Select<T extends string = string>({
  className,
  contentClassName,
  disabled,
  onValueChange,
  options,
  placeholder = 'Wybierz opcję',
  type = 'button',
  value,
  ...props
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type={type}
          variant="outline"
          className={cn(
            'w-full justify-between font-normal text-left data-[state=open]:[&_svg]:rotate-180',
            !selectedOption && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
          {...props}
        >
          <span className="truncate">
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 ease-out" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn(
          'ui-select-content w-[var(--radix-dropdown-menu-trigger-width)] overflow-hidden p-0',
          contentClassName
        )}
      >
        <div className="ui-select-viewport p-1">
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(nextValue) => {
              onValueChange(nextValue as T);
              setOpen(false);
            }}
          >
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="ui-select-option"
              >
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { Select };
export type { SelectOption, SelectProps };
