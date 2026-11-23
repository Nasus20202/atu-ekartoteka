export interface LabelledApartment {
  address: string | null;
  building: string | null;
  number: string;
}

/** "Street 12/3": address, building and apartment number. */
export function formatApartmentLabel(apartment: LabelledApartment): string {
  return `${apartment.address ?? ''} ${apartment.building || ''}/${apartment.number}`
    .replace(/\s+\//g, ' /')
    .trim();
}
