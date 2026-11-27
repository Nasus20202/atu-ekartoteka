import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { settlementsDto } from '@/__tests__/helpers/settlement-pdf/settlement-dtos';
import { DownloadSettlementPdfButton } from '@/components/pdf/download-settlement-pdf-button';
import type { PdfDownloadButtonProps } from '@/components/pdf/pdf-download-button';
import type { SettlementViewKey } from '@/components/settlements/settlement-view-key';
import type { ApartmentSettlementsDto } from '@/lib/settlements/dto/settlement-view-dto';

const mocks = vi.hoisted(() => ({
  buttonProps: null as PdfDownloadButtonProps | null,
  pdf: vi.fn(),
  loaded: [] as string[],
}));

vi.mock('@/components/pdf/pdf-download-button', () => ({
  PdfDownloadButton: (props: PdfDownloadButtonProps) => {
    mocks.buttonProps = props;
    return null;
  },
}));
vi.mock('@react-pdf/renderer', () => {
  mocks.loaded.push('renderer');
  return { pdf: mocks.pdf };
});
vi.mock('@/components/pdf/utility-settlement-pdf-document', () => ({
  UtilitySettlementPdfDocument: () => null,
}));
vi.mock('@/components/pdf/meters-pdf-document', () => ({
  MetersPdfDocument: () => null,
}));
vi.mock('@/components/pdf/annual-costs-pdf-document', () => ({
  AnnualCostsPdfDocument: () => null,
}));

const BLOB = new Blob(['pdf']);

function renderButton(
  view: SettlementViewKey,
  data: ApartmentSettlementsDto = settlementsDto()
) {
  render(
    <DownloadSettlementPdfButton
      view={view}
      data={data}
      apartmentLabel="Lipowa 5/1"
      hoaName="Wspólnota"
    />
  );
  return mocks.buttonProps;
}

describe('DownloadSettlementPdfButton', () => {
  beforeEach(() => {
    mocks.buttonProps = null;
    mocks.pdf.mockReset();
    mocks.pdf.mockReturnValue({ toBlob: () => Promise.resolve(BLOB) });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 26, 0, 30));
  });
  afterEach(() => vi.useRealTimers());

  it('loads the PDF library only when a file is asked for', async () => {
    const props = renderButton('media');
    expect(mocks.loaded).toEqual([]);

    await props!.createPdf();

    expect(mocks.loaded).toEqual(['renderer']);
  });

  it.each([
    ['media', 'rozliczenie-mediow-Lipowa 5/1-2022-05-01-2022-09-30.pdf'],
    ['meters', 'liczniki-Lipowa 5/1-2026-11-26.pdf'],
    ['annual', 'koszty-rzeczywiste-Lipowa 5/1-2025-01-01-2025-12-31.pdf'],
  ] as const)('names the %s file', async (view, fileName) => {
    const file = await renderButton(view)!.createPdf();

    expect(file).toEqual({ blob: BLOB, fileName });
    const [element] = mocks.pdf.mock.calls[0] as [ReactElement];
    expect(element.props).toMatchObject({
      apartmentLabel: 'Lipowa 5/1',
      hoaName: 'Wspólnota',
      generatedDate: '2026-11-26',
    });
  });

  it.each<[SettlementViewKey, Partial<ApartmentSettlementsDto>]>([
    ['media', { utility: null }],
    ['meters', { utility: null }],
    ['meters', { readings: [] }],
    ['annual', { annual: null }],
  ])('offers nothing for %s without data', (view, missing) => {
    expect(renderButton(view, settlementsDto(missing))).toBeNull();
  });
});
