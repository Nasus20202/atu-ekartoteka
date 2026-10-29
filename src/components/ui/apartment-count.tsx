import { APARTMENT_FORMS, formatCountPl } from '@/lib/utils/pluralize';

interface ApartmentCountProps {
  count: number;
}

export function ApartmentCount({ count }: ApartmentCountProps) {
  return <span>{formatCountPl(count, APARTMENT_FORMS)}</span>;
}
