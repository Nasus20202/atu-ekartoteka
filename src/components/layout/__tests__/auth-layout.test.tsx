import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import packageJson from '@/../package.json';
import { AuthLayout } from '@/components/layout/auth-layout';

vi.mock('@/components/theme/theme-toggle', () => ({
  ThemeToggle: () => <button>Motyw</button>,
}));

describe('AuthLayout', () => {
  it('renders the header, content, version and theme toggle', () => {
    render(
      <AuthLayout
        title="Logowanie"
        description="Zaloguj się"
        icon={<span>ikona</span>}
      >
        <p>Formularz</p>
      </AuthLayout>
    );

    expect(screen.getByText('Logowanie')).toBeInTheDocument();
    expect(screen.getByText('Zaloguj się')).toBeInTheDocument();
    expect(screen.getByText('ikona')).toBeInTheDocument();
    expect(screen.getByText('Formularz')).toBeInTheDocument();
    expect(screen.getByText(`v${packageJson.version}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Motyw' })).toBeInTheDocument();
  });

  it('renders only the content without header props or theme toggle', () => {
    render(
      <AuthLayout showThemeToggle={false}>
        <p>Formularz</p>
      </AuthLayout>
    );

    const content = screen.getByText('Formularz').parentElement;
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(content?.parentElement?.children).toHaveLength(1);
  });

  it.each([
    [{ title: 'Tytuł' }, 'Tytuł'],
    [{ description: 'Opis' }, 'Opis'],
    [{ icon: <span>ikona</span> }, 'ikona'],
  ])('renders the header with only %o', (props, text) => {
    render(<AuthLayout {...props}>treść</AuthLayout>);

    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
