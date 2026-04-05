export function pluralizeApartments(n: number): string {
  if (n === 1) return '1 mieszkanie';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) {
    return `${n} mieszkania`;
  }
  return `${n} mieszkań`;
}

interface ApartmentCountProps {
  count: number;
}

export function ApartmentCount({ count }: ApartmentCountProps) {
  return <span>{pluralizeApartments(count)}</span>;
}
