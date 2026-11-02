import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { groupErrors } from '@/components/import/error-groups';
import { GroupedIssues } from '@/components/import/grouped-issues';

describe('GroupedIssues', () => {
  it('renders a heading with the count for each group and its items', () => {
    const errors = [
      { kind: 'transaction' as const, message: 'Błąd A' },
      { kind: 'balance-mismatch' as const, message: 'Błąd B' },
      { kind: 'transaction' as const, message: 'Błąd C' },
    ];

    render(
      <GroupedIssues
        groups={groupErrors(errors)}
        tone="error"
        formatItem={({ message }) => message}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Błąd transakcji (2)' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Saldo zamknięcia wpłat (1)' })
    ).toBeInTheDocument();
    expect(screen.getByText('• Błąd C')).toBeInTheDocument();
  });

  it('renders nothing without groups', () => {
    const { container } = render(
      <GroupedIssues groups={[]} tone="warning" formatItem={() => ''} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the summary lines of a group above its items', () => {
    render(
      <GroupedIssues
        groups={[
          {
            kind: 'year-balance',
            title: 'Salda lat (1)',
            description: 'Różnice sald między latami',
            summary: ['2024: 10,00 zł', '2025: 20,00 zł'],
            items: [{ message: 'Błąd A' }],
          },
        ]}
        tone="warning"
        formatItem={({ message }) => message}
      />
    );

    expect(screen.getByText('2024: 10,00 zł')).toBeInTheDocument();
    expect(screen.getByText('2025: 20,00 zł')).toBeInTheDocument();
    expect(screen.getByText('• Błąd A')).toBeInTheDocument();
  });
});
