import { ReactNode } from 'react';

import packageJson from '@/../package.json';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  icon?: ReactNode;
  showThemeToggle?: boolean;
}

export function AuthLayout({
  children,
  title,
  description,
  icon,
  showThemeToggle = true,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 animate-fade-in">
      {showThemeToggle && (
        <div className="fixed right-4 top-4 animate-slide-in-top">
          <ThemeToggle />
        </div>
      )}
      <div className="fixed bottom-4 left-4 animate-fade-in">
        <p className="text-xs text-muted-foreground/60">
          v{packageJson.version}
        </p>
      </div>
      <Card className="w-full max-w-md shadow-lg dark:border-border animate-scale-in">
        {(title || description || icon) && (
          <CardHeader>
            {icon && <div className="mb-4 flex justify-center">{icon}</div>}
            {title && (
              <CardTitle className="text-center text-2xl font-bold tracking-tight">
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-center">
                {description}
              </CardDescription>
            )}
          </CardHeader>
        )}
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
