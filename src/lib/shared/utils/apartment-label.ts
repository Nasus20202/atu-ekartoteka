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

/** "Street 12/3 – Owner": tells apart apartments and accounts with alike names. */
export function formatOwnedApartmentLabel(
  apartment: LabelledApartment & { owner: string | null }
): string {
  const address = formatApartmentLabel(apartment);

  return apartment.owner ? `${address} – ${apartment.owner}` : address;
}
