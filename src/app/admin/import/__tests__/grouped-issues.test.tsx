import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { groupErrors } from '@/app/admin/import/error-groups';
import { GroupedIssues } from '@/app/admin/import/grouped-issues';

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
});
