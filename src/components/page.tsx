import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
};

export function Page({ children, maxWidth = '6xl', className }: PageProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="p-8">
        <div
          className={cn(
            'mx-auto animate-fade-in',
            maxWidthClasses[maxWidth],
            className
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
