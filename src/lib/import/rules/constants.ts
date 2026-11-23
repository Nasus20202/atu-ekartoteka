export const NAL_AMOUNT_TOLERANCE = 0.01;
export const WPLATY_BALANCE_TOLERANCE = 0.01;
// Cross-file: sum of nal_czynsz per apartment/month vs wplaty monthly charge.
// Rounding accumulates across multiple charge lines so allow up to 0.05 per month.
export const CROSS_CHARGES_TOLERANCE = 0.05;

// Charge lines settling prepaid advances; the exporter leaves them out of the
// monthly charges in wplaty.txt
export const SETTLEMENT_DESCRIPTION_PREFIX = 'wyrównani';

// Appended to warnings about values loaded from the files that the app ignores
export const MONTHLY_CHARGES_IGNORED_NOTE =
  'Pole naliczeń miesięcznych z wpłat jest pomijane — aplikacja używa sum naliczeń.';
export const CLOSING_BALANCE_IGNORED_NOTE =
  'Saldo zamknięcia z pliku jest pomijane — aplikacja wylicza je z naliczeń.';

export const IMPORT_CREATE_BATCH_SIZE = 500;
export const IMPORT_HOA_CONCURRENCY = 2;
