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
            kind: 'line-total',
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
            kind: 'skipped-records',
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

  it('groups warnings under a heading for each kind', () => {
    render(
      <ImportWarnings
        warnings={[
          {
            kind: 'line-total',
            apartmentExternalId: 'APT001',
            message: 'suma niezgodna',
          },
          {
            kind: 'skipped-records',
            apartmentExternalId: 'APT-STELES',
            message: 'Pominięto 1 wpłatę dla N00001',
          },
          {
            kind: 'line-total',
            apartmentExternalId: 'APT002',
            message: 'kolejna suma',
          },
        ]}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Kwoty linii naliczeń (2)' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Pominięte rekordy (1)' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Kwota linii w nal_czynsz.txt nie równa się ilości pomnożonej przez cenę jednostkową.'
      )
    ).toBeInTheDocument();
  });
});
