import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RegisterSuccess } from '@/app/register/register-success';

describe('RegisterSuccess', () => {
  it('tells a tenant the account awaits approval', () => {
    render(<RegisterSuccess isFirstAdmin={false} />);

    expect(screen.getByText('Konto utworzone!')).toBeInTheDocument();
    expect(screen.getByText(/oczekuje na zatwierdzenie/)).toBeInTheDocument();
  });

  it('tells the first admin they have full access', () => {
    render(<RegisterSuccess isFirstAdmin />);

    expect(
      screen.getByText('Konto administratora utworzone!')
    ).toBeInTheDocument();
    expect(screen.getByText(/pełny dostęp/)).toBeInTheDocument();
  });
});
