import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ImportWarnings } from '@/app/admin/import/import-warnings';

describe('ImportWarnings', () => {
  it('renders nothing without warnings', () => {
    const { container } = render(<ImportWarnings warnings={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders period, line and difference for line-total warnings', () => {
    render(
      <ImportWarnings
        warnings={[
          {
            apartmentExternalId: 'APT001',
            period: '202501',
            lineNo: 3,
            difference: '0.0252',
            message: 'suma niezgodna',
          },
        ]}
      />
    );

    expect(screen.getByText('Ostrzeżenia (1)')).toBeInTheDocument();
    expect(
      screen.getByText(
        '• Lokal APT001, okres 202501, linia 3, różnica 0.0252: suma niezgodna'
      )
    ).toBeInTheDocument();
  });

  it('renders only apartment and message when other fields are absent', () => {
    render(
      <ImportWarnings
        warnings={[
          {
            apartmentExternalId: 'APT-STELES',
            message: 'Pominięto 1 wpłatę dla N00001',
          },
        ]}
      />
    );

    expect(
      screen.getByText('• Lokal APT-STELES: Pominięto 1 wpłatę dla N00001')
    ).toBeInTheDocument();
  });
});
