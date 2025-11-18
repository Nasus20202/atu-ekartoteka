export interface LokEntry {
  id: string;
  owner: string;
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

export async function parseLokBuffer(buffer: Buffer): Promise<LokEntry[]> {
  const iconv = await import('iconv-lite');
  const content = iconv.decode(buffer, 'iso-8859-2');
  const lines = content.split('\n').filter((line: string) => line.trim());

  const entries: LokEntry[] = [];

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
      ,
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
      owner: owner.trim(),
      externalId: externalId.trim(),
      address: address.trim(),
      building: building.trim(),
      number: number.trim(),
      postalCode: postalCode.trim(),
      city: city.trim(),
      area,
      height,
      isOwner,
    });
  }

  return entries;
}

export function getUniqueApartments(entries: LokEntry[]): LokEntry[] {
  const apartmentMap = new Map<string, LokEntry>();

  for (const entry of entries) {
    if (entry.isOwner && !apartmentMap.has(entry.externalId)) {
      apartmentMap.set(entry.externalId, entry);
    }
  }

  return Array.from(apartmentMap.values());
}
