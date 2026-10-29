import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { sessionProviderProps, themeProviderProps } = vi.hoisted(() => ({
  sessionProviderProps: [] as unknown[],
  themeProviderProps: [] as Record<string, unknown>[],
}));

vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => {
    sessionProviderProps.push(children);
    return <div data-testid="session">{children}</div>;
  },
}));

vi.mock('next-themes', () => ({
  ThemeProvider: ({
    children,
    ...props
  }: Record<string, unknown> & { children: React.ReactNode }) => {
    themeProviderProps.push(props);
    return <div data-testid="theme">{children}</div>;
  },
}));

import { SessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';

describe('SessionProvider', () => {
  it('wraps children in the NextAuth session provider', () => {
    render(
      <SessionProvider>
        <p>treść</p>
      </SessionProvider>
    );

    expect(screen.getByTestId('session')).toContainElement(
      screen.getByText('treść')
    );
  });
});

describe('ThemeProvider', () => {
  it('passes props through and keeps theme transitions enabled', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system">
        <p>treść</p>
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toContainElement(
      screen.getByText('treść')
    );
    expect(themeProviderProps.at(-1)).toEqual({
      attribute: 'class',
      defaultTheme: 'system',
      disableTransitionOnChange: false,
    });
  });
});
