import { NAL_AMOUNT_TOLERANCE } from '@/lib/import/rules/constants';
import {
  type Decimal,
  type DecimalLike,
  toDecimal,
} from '@/lib/shared/utils/decimal';

/** Equal up to the rounding allowed by the text file import. */
export function isWithinTolerance(
  actual: Decimal,
  expected: DecimalLike,
  tolerance: number = NAL_AMOUNT_TOLERANCE
): boolean {
  return actual.minus(toDecimal(expected)).abs().lte(tolerance);
}
