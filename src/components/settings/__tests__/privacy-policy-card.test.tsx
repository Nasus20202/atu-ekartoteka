import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrivacyPolicyCard } from '@/components/settings/privacy-policy-card';

const mocks = vi.hoisted(() => ({
  updateSettingsAction: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('@/actions/settings/settings', () => ({
  updateSettingsAction: mocks.updateSettingsAction,
}));
vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => mocks.confirm,
}));
vi.mock('@/lib/privacy/template', () => ({
  PRIVACY_POLICY_TEMPLATE: '# Szablon\n\nAdministrator: [[nazwa]] [[adres]]',
}));

describe('PrivacyPolicyCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirm.mockResolvedValue(true);
  });

  it('shows a published policy with the edit button and a link to the page', () => {
    render(<PrivacyPolicyCard initialPolicy="# Polityka" />);

    expect(screen.getByText('Opublikowana')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edytuj' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Zobacz stronę' })).toHaveAttribute(
      'href',
      '/privacy'
    );
  });

  it('shows an unpublished state with a button to write the policy', () => {
    render(<PrivacyPolicyCard initialPolicy={null} />);

    expect(screen.getByText('Nieopublikowana')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Napisz politykę' })
    ).toBeInTheDocument();
  });

  it('opens the dialog on the rendered preview', async () => {
    render(<PrivacyPolicyCard initialPolicy={'# Moja polityka\n\nTekst'} />);

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Edytuj' }));

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('tab', { name: 'Podgląd' })
    ).toHaveAttribute('data-state', 'active');
    expect(
      within(dialog).getByRole('heading', { level: 1, name: 'Moja polityka' })
    ).toBeInTheDocument();
  });

  it('switches to a labelled editor with the Markdown text and a hint', async () => {
    const user = userEvent.setup();
    render(<PrivacyPolicyCard initialPolicy="# Moja polityka" />);
    await user.click(screen.getByRole('button', { name: 'Edytuj' }));

    await user.click(screen.getByRole('tab', { name: 'Edycja' }));

    expect(screen.getByLabelText('Tekst polityki (Markdown)')).toHaveValue(
      '# Moja polityka'
    );
    expect(screen.getByText(/Najwyżej 50000 znaków/)).toBeInTheDocument();
  });

  it('offers a template when nothing is written and loads it unsaved', async () => {
    const user = userEvent.setup();
    render(<PrivacyPolicyCard initialPolicy={null} />);
    await user.click(screen.getByRole('button', { name: 'Napisz politykę' }));

    await user.click(
      screen.getByRole('button', { name: 'Zacznij od szablonu' })
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Szablon' })
    ).toBeInTheDocument();
    expect(mocks.updateSettingsAction).not.toHaveBeenCalled();
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it('highlights unresolved placeholders and counts them in the footer', async () => {
    const user = userEvent.setup();
    render(<PrivacyPolicyCard initialPolicy={null} />);
    await user.click(screen.getByRole('button', { name: 'Napisz politykę' }));
    await user.click(
      screen.getByRole('button', { name: 'Zacznij od szablonu' })
    );

    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText('[[nazwa]]').tagName).toBe('MARK');
    expect(
      within(dialog).getByText('Pola do uzupełnienia: 2')
    ).toBeInTheDocument();
  });

  it('asks before replacing text with the template', async () => {
    const user = userEvent.setup();
    render(<PrivacyPolicyCard initialPolicy="Moja polityka" />);
    await user.click(screen.getByRole('button', { name: 'Edytuj' }));

    await user.click(screen.getByRole('button', { name: 'Wczytaj szablon' }));

    expect(mocks.confirm).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Szablon' })
    ).toBeInTheDocument();
  });

  it('shows the server rejection inside the dialog', async () => {
    mocks.updateSettingsAction.mockResolvedValue({
      ok: false,
      code: 'invalid',
      error: 'Uzupełnij lub usuń pola oznaczone podwójnymi nawiasami [[…]]',
    });
    const user = userEvent.setup();
    render(<PrivacyPolicyCard initialPolicy={null} />);
    await user.click(screen.getByRole('button', { name: 'Napisz politykę' }));
    await user.click(
      screen.getByRole('button', { name: 'Zacznij od szablonu' })
    );

    await user.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(
      await screen.findByText(/Uzupełnij lub usuń pola oznaczone/)
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('saves, closes the dialog and shows the success message on the card', async () => {
    mocks.updateSettingsAction.mockResolvedValue({
      ok: true,
      data: { privacyPolicy: 'Gotowa polityka' },
    });
    const user = userEvent.setup();
    render(<PrivacyPolicyCard initialPolicy={null} />);
    await user.click(screen.getByRole('button', { name: 'Napisz politykę' }));
    await user.click(screen.getByRole('tab', { name: 'Edycja' }));
    await user.type(
      screen.getByLabelText('Tekst polityki (Markdown)'),
      'Gotowa polityka'
    );

    await user.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(await screen.findByText('Zapisano ustawienia')).toBeInTheDocument();
    expect(screen.getByText('Opublikowana')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('disables saving until something changed', async () => {
    const user = userEvent.setup();
    render(<PrivacyPolicyCard initialPolicy="Tekst" />);

    await user.click(screen.getByRole('button', { name: 'Edytuj' }));

    expect(screen.getByRole('button', { name: 'Zapisz' })).toBeDisabled();
  });

  it('asks before closing with unsaved changes', async () => {
    mocks.confirm.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<PrivacyPolicyCard initialPolicy="Tekst" />);
    await user.click(screen.getByRole('button', { name: 'Edytuj' }));
    await user.click(screen.getByRole('tab', { name: 'Edycja' }));
    await user.type(
      screen.getByLabelText('Tekst polityki (Markdown)'),
      ' więcej'
    );

    await user.click(screen.getByRole('button', { name: 'Anuluj' }));

    expect(mocks.confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
