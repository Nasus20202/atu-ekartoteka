import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { HoaNoticeCard } from '@/app/admin/apartments/[hoaId]/hoa-notice-card';

const TRIGGER_NAME = /Nagłówek i stopka powiadomień/;

async function expand() {
  await userEvent.click(screen.getByRole('button', { name: TRIGGER_NAME }));
}

describe('HoaNoticeCard', () => {
  it('is collapsed by default and hides the texts', () => {
    render(<HoaNoticeCard header="Nagłówek wspólnoty" footer="Tekst stopki" />);

    expect(screen.getByRole('button', { name: TRIGGER_NAME })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByText('Nagłówek wspólnoty')).not.toBeInTheDocument();
    expect(screen.queryByText('Tekst stopki')).not.toBeInTheDocument();
  });

  it('shows the header and the footer once expanded', async () => {
    render(<HoaNoticeCard header="Nagłówek wspólnoty" footer="Tekst stopki" />);

    await expand();

    expect(screen.getByText('Nagłówek wspólnoty')).toBeInTheDocument();
    expect(screen.getByText('Tekst stopki')).toBeInTheDocument();
  });

  it('collapses again on a second click', async () => {
    render(<HoaNoticeCard header="Nagłówek wspólnoty" footer={null} />);

    await expand();
    await expand();

    expect(screen.queryByText('Nagłówek wspólnoty')).not.toBeInTheDocument();
  });

  it('shows only the text that exists', async () => {
    render(<HoaNoticeCard header={null} footer="Tylko stopka" />);

    await expand();

    expect(screen.getByText('Tylko stopka')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Nagłówek' })
    ).not.toBeInTheDocument();
  });

  it('renders nothing without header and footer', () => {
    const { container } = render(<HoaNoticeCard header={null} footer={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('keeps line breaks of multi-line text', async () => {
    render(<HoaNoticeCard header={'Linia 1\nLinia 2'} footer={null} />);

    await expand();

    expect(screen.getByText(/Linia 1/).className).toContain(
      'whitespace-pre-line'
    );
  });
});
