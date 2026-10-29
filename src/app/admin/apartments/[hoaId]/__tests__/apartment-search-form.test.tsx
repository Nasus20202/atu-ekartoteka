import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApartmentSearchForm } from '@/app/admin/apartments/[hoaId]/apartment-search-form';

describe('ApartmentSearchForm', () => {
  it('submits the typed search', async () => {
    const onSearch = vi.fn();
    render(<ApartmentSearchForm defaultSearch="17" onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Wyszukaj...');
    expect(input).toHaveValue('17');
    await userEvent.clear(input);
    await userEvent.type(input, '17/12');
    await userEvent.click(screen.getByRole('button', { name: 'Szukaj' }));

    expect(onSearch).toHaveBeenCalledWith('17/12');
  });
});
