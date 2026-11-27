export type SettlementViewKey = 'media' | 'meters' | 'annual';

export const DEFAULT_SETTLEMENT_VIEW: SettlementViewKey = 'media';

export const SETTLEMENT_VIEWS: Array<{
  key: SettlementViewKey;
  label: string;
}> = [
  { key: 'media', label: 'Media' },
  { key: 'meters', label: 'Liczniki' },
  { key: 'annual', label: 'Koszty rzeczywiste' },
];

/**
 * Query parameters of the chosen view, the selected records and the table of
 * readings.
 */
export const SETTLEMENT_PARAMS = {
  view: 'view',
  utility: 'period',
  annual: 'year',
  meter: 'meter',
  readingSort: 'readingSort',
  readingOrder: 'readingOrder',
} as const;

export const SETTLEMENTS_PATH = '/dashboard/settlements';

/** The view named by the address; the first one for anything unknown. */
export const toSettlementView = (value: string | null): SettlementViewKey =>
  SETTLEMENT_VIEWS.find(({ key }) => key === value)?.key ??
  DEFAULT_SETTLEMENT_VIEW;

export const apartmentSettlementsPath = (
  apartmentId: string,
  view: SettlementViewKey = DEFAULT_SETTLEMENT_VIEW
) => {
  const query =
    view === DEFAULT_SETTLEMENT_VIEW
      ? ''
      : `?${SETTLEMENT_PARAMS.view}=${view}`;
  return `${SETTLEMENTS_PATH}/${apartmentId}${query}`;
};
