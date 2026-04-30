import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ImportWarnings } from '@/app/admin/import/page';

describe('ImportWarnings', () => {
  it('renders structured warnings with apartment, period and difference', () => {
    render(
      <ImportWarnings
        warnings={[
          {
            apartmentExternalId: 'APT-101',
            period: '202401',
            lineNo: 12,
            difference: '0.0250',
            message:
              'Naliczenie NAL001 (lokal APT-101, linia 12): suma 10.0250 ≠ 2.0000 × 5.0000 = 10.0000 (różnica 0.0250)',
          },
        ]}
      />
    );

    expect(screen.getByText(/Ostrzeżenia \(1\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Lokal APT-101, okres 202401, linia 12, różnica 0.0250:/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Naliczenie NAL001/i)).toBeInTheDocument();
  });

  it('renders nothing when there are no warnings', () => {
    const { container } = render(<ImportWarnings warnings={[]} />);

    expect(container.firstChild).toBeNull();
  });
});
