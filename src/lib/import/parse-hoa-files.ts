import type { HOAImportResult, ImportFileGroup } from '@/lib/import/types';
import {
  createEmptyStats,
  parseFileToBuffer,
  parseWmbDate,
} from '@/lib/import/utils';
import {
  getUniqueApartments,
  parseApartmentBuffer,
} from '@/lib/parsers/apartment-parser';
import { parseNalCzynszBuffer } from '@/lib/parsers/nal-czynsz-parser';
import { parsePowCzynszFile } from '@/lib/parsers/pow-czynsz-parser';
import { parseWplatyFile } from '@/lib/parsers/wplaty-parser';

export type ParsedHoaFiles = Awaited<ReturnType<typeof parseHoaFiles>>;

/** Parses one HOA's files and records totals and WMB dates on the result. */
export async function parseHoaFiles(
  fileGroup: ImportFileGroup,
  result: HOAImportResult
) {
  const {
    lokFile,
    chargesFile,
    notificationsFile,
    paymentsFile,
    apartmentsWmbFile,
    chargesWmbFile,
    notificationsWmbFile,
  } = fileGroup;

  const apartments = lokFile
    ? getUniqueApartments(
        await parseApartmentBuffer(await parseFileToBuffer(lokFile))
      )
    : [];
  result.apartments.total = apartments.length;

  const chargeEntries = chargesFile
    ? await parseNalCzynszBuffer(await parseFileToBuffer(chargesFile))
    : null;
  if (chargeEntries) {
    result.charges = createEmptyStats();
    result.charges.total = chargeEntries.length;
  }

  const notificationData = notificationsFile
    ? await parsePowCzynszFile(await parseFileToBuffer(notificationsFile))
    : null;
  if (notificationData) {
    result.notifications = createEmptyStats();
    result.notifications.total = notificationData.entries.length;
  }

  const paymentData = paymentsFile
    ? await parseWplatyFile(await parseFileToBuffer(paymentsFile))
    : null;
  if (paymentData) {
    result.payments = createEmptyStats();
    result.payments.total = paymentData.entries.length;
  }

  // Parse WMB dates
  result.apartmentsDataDate = apartmentsWmbFile
    ? await parseWmbDate(await parseFileToBuffer(apartmentsWmbFile))
    : undefined;
  result.chargesDataDate = chargesWmbFile
    ? await parseWmbDate(await parseFileToBuffer(chargesWmbFile))
    : undefined;
  result.notificationsDataDate = notificationsWmbFile
    ? await parseWmbDate(await parseFileToBuffer(notificationsWmbFile))
    : undefined;

  return { apartments, chargeEntries, notificationData, paymentData };
}
