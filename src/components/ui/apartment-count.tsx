import { APARTMENT_FORMS, formatCountPl } from '@/lib/shared/utils/pluralize';

interface ApartmentCountProps {
  count: number;
}

export function ApartmentCount({ count }: ApartmentCountProps) {
  return <span>{formatCountPl(count, APARTMENT_FORMS)}</span>;
}
