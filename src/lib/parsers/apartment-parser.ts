export interface ApartmentEntry {
  id: string;
  owner: string;
  email: string;
  externalId: string;
  address: string;
  building: string;
  number: string;
  postalCode: string;
  city: string;
  area: number;
  height: number;
  isOwner: boolean;
}

import { decodeBuffer } from '@/lib/parsers/parser-utils';

export async function parseApartmentBuffer(
  buffer: Buffer
): Promise<ApartmentEntry[]> {
  const content = await decodeBuffer(buffer);
  const lines = content.split('\n').filter((line: string) => line.trim());

  const entries: ApartmentEntry[] = [];

  for (const line of lines) {
    const fields = line.split('#');

    if (fields.length < 13) {
      continue;
    }

    const [
      id,
      owner,
      ,
      externalId,
      address,
      building,
      number,
      postalCode,
      city,
      email,
      ,
      ,
      areaStr,
      heightStr,
    ] = fields;

    const isOwner = id.startsWith('W');
    const area = parseFloat(areaStr) || 0;
    const height = parseFloat(heightStr) || 0;

    entries.push({
      id: id.trim(),
      owner: owner?.trim(),
      email: email?.trim(),
      externalId: externalId.trim(),
      address: address?.trim(),
      building: building?.trim(),
      number: number?.trim(),
      postalCode: postalCode?.trim(),
      city: city?.trim(),
      area,
      height,
      isOwner,
    });
  }

  return entries;
}

export function getUniqueApartments(
  entries: ApartmentEntry[]
): ApartmentEntry[] {
  const apartmentMap = new Map<string, ApartmentEntry>();

  for (const entry of entries) {
    if (entry.isOwner && !apartmentMap.has(entry.externalId)) {
      apartmentMap.set(entry.externalId, entry);
    }
  }

  return Array.from(apartmentMap.values());
}
