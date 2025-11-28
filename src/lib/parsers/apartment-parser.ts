export interface ApartmentEntry {
  externalOwnerId: string; // Owner ID from file (e.g. "W00164")
  externalApartmentId: string; // Apartment ID from HOA system (e.g. "KLO11-KLO11-00000-00004M")
  owner: string;
  email: string;
  address: string;
  building: string;
  number: string;
  postalCode: string;
  city: string;
  shareNumerator: number;
  shareDenominator: number;
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

    // Handle owner names with hashtags
    // Standard format: id(0)#owner(1)#?(2)#externalId(3)#address(4)#building(5)#number(6)#postalCode(7)#city(8)#email(9)#?(10)#?(11)#area(12)#height(13+)
    // If more than 14 fields, the extra ones belong to the owner name (fields 1 to externalId_index-1)
    // We need at least 14 fields for a complete entry (id, owner, ?, externalId, address, building, number, postalCode, city, email, ?, ?, area, height)

    const id = fields[0];
    let ownerEndIndex = 1;
    let externalIdIndex = 3;

    if (fields.length > 14) {
      const extraFields = fields.length - 14;
      ownerEndIndex = 1 + extraFields;
      externalIdIndex = 3 + extraFields;
    }

    // Reconstruct owner name with hashtags
    const ownerParts = fields.slice(1, ownerEndIndex + 1);
    const owner = ownerParts.join('#');

    const hoaExternalId = fields[externalIdIndex];
    const address = fields[externalIdIndex + 1];
    const building = fields[externalIdIndex + 2];
    const number = fields[externalIdIndex + 3];
    const postalCode = fields[externalIdIndex + 4];
    const city = fields[externalIdIndex + 5];
    const email = fields[externalIdIndex + 6];
    const areaStr = fields[externalIdIndex + 9];
    const heightStr = fields[externalIdIndex + 10];

    const isOwner = id.startsWith('W');
    const shareNumerator = parseFloat(areaStr) || 0;
    const shareDenominator = parseFloat(heightStr) || 0;

    const trimmedOwnerId = id.trim();
    const trimmedApartmentId = hoaExternalId?.trim() || '';

    entries.push({
      externalOwnerId: trimmedOwnerId,
      externalApartmentId: trimmedApartmentId,
      owner: owner?.trim(),
      email: email?.trim(),
      address: address?.trim(),
      building: building?.trim(),
      number: number?.trim(),
      postalCode: postalCode?.trim(),
      city: city?.trim(),
      shareNumerator,
      shareDenominator,
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
    const key = `${entry.externalOwnerId}#${entry.externalApartmentId}`;
    if (entry.isOwner && !apartmentMap.has(key)) {
      apartmentMap.set(key, entry);
    }
  }

  return Array.from(apartmentMap.values());
}
