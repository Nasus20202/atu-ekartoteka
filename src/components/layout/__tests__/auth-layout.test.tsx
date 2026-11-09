import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthLayout } from '@/components/layout/auth-layout';

describe('AuthLayout', () => {
  it('renders the header and content', () => {
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
  });

  it('renders only the content without header props', () => {
    render(<AuthLayout>treść</AuthLayout>);

    const content = screen.getByText('treść');
    expect(content.parentElement?.children).toHaveLength(1);
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
