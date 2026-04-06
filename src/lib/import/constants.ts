export const NAL_AMOUNT_TOLERANCE = 0.01;
export const WPLATY_BALANCE_TOLERANCE = 0.01;
// Cross-file: sum of nal_czynsz per apartment/month vs wplaty monthly charge.
// Rounding accumulates across multiple charge lines so allow up to 0.05 per month.
export const CROSS_CHARGES_TOLERANCE = 0.05;
