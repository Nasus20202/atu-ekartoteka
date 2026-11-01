import { mergeParsedFiles, parseFiles } from '@/lib/import/merge-files';
import type {
  HOAImportResult,
  ImportErrorItem,
  ImportFileGroup,
} from '@/lib/import/types';
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

async function parseApartmentFiles(files: File[]) {
  const parsed = await parseFiles(files, async (buffer) =>
    getUniqueApartments(await parseApartmentBuffer(buffer))
  );
  return mergeParsedFiles(
    parsed.map(({ fileName, result }) => ({ fileName, entries: result })),
    (entry) => `${entry.externalOwnerId}#${entry.externalApartmentId}`
  );
}

async function parseChargeFiles(files: File[]) {
  const parsed = await parseFiles(files, parseNalCzynszBuffer);
  return mergeParsedFiles(
    parsed.map(({ fileName, result }) => ({ fileName, entries: result })),
    (entry) =>
      `${entry.id}#${entry.apartmentExternalId}|${entry.period}|${entry.lineNo}`
  );
}

async function parseNotificationFiles(files: File[]) {
  const parsed = await parseFiles(files, parsePowCzynszFile);
  const merged = mergeParsedFiles(
    parsed.map(({ fileName, result }) => ({
      fileName,
      entries: result.entries,
    })),
    (entry) => `${entry.externalId}#${entry.apartmentCode}|${entry.lineNo}`
  );
  // Every export repeats the same HOA header and footer; keep the first one
  const withHeader = parsed.find(({ result }) => result.header?.length);
  return {
    ...merged,
    header: withHeader?.result.header,
    footer: withHeader?.result.footer,
  };
}

async function parsePaymentFiles(files: File[]) {
  const parsed = await parseFiles(files, parseWplatyFile);
  return mergeParsedFiles(
    parsed.map(({ fileName, result }) => ({
      fileName,
      entries: result.entries,
    })),
    (entry) => `${entry.externalId}#${entry.apartmentCode}|${entry.year}`
  );
}

/** Returns the newest date among the WMB files of one data type, if any has a valid date. */
async function parseWmbDates(wmbFiles: File[]) {
  const dates = await Promise.all(
    wmbFiles.map(async (file) => parseWmbDate(await parseFileToBuffer(file)))
  );
  const validDates = dates.filter((date): date is Date => date !== undefined);
  if (validDates.length === 0) return undefined;
  return new Date(Math.max(...validDates.map((date) => date.getTime())));
}

/** A WMB date only applies to the data it describes, so it is ignored without that data's .txt files. */
async function parseWmbDatesFor(txtFiles: File[], wmbFiles: File[]) {
  return txtFiles.length > 0 ? parseWmbDates(wmbFiles) : undefined;
}

/** Parses and merges one HOA's files and records totals and WMB dates on the result. */
export async function parseHoaFiles(
  fileGroup: ImportFileGroup,
  result: HOAImportResult
) {
  const {
    lokFiles = [],
    chargesFiles = [],
    notificationsFiles = [],
    paymentsFiles = [],
    apartmentsWmbFiles = [],
    chargesWmbFiles = [],
    notificationsWmbFiles = [],
  } = fileGroup;
  const duplicateErrors: ImportErrorItem[] = [];

  const apartmentFiles = await parseApartmentFiles(lokFiles);
  duplicateErrors.push(...apartmentFiles.errors);
  const apartments = apartmentFiles.entries;
  result.apartments.total = apartments.length;

  let chargeEntries = null;
  if (chargesFiles.length > 0) {
    const charges = await parseChargeFiles(chargesFiles);
    duplicateErrors.push(...charges.errors);
    chargeEntries = charges.entries;
    result.charges = { ...createEmptyStats(), total: chargeEntries.length };
  }

  let notificationData = null;
  if (notificationsFiles.length > 0) {
    const { errors, ...data } =
      await parseNotificationFiles(notificationsFiles);
    duplicateErrors.push(...errors);
    notificationData = data;
    result.notifications = {
      ...createEmptyStats(),
      total: data.entries.length,
    };
  }

  let paymentData = null;
  if (paymentsFiles.length > 0) {
    const payments = await parsePaymentFiles(paymentsFiles);
    duplicateErrors.push(...payments.errors);
    paymentData = { entries: payments.entries };
    result.payments = {
      ...createEmptyStats(),
      total: payments.entries.length,
    };
  }

  result.apartmentsDataDate = await parseWmbDatesFor(
    lokFiles,
    apartmentsWmbFiles
  );
  result.chargesDataDate = await parseWmbDatesFor(
    chargesFiles,
    chargesWmbFiles
  );
  result.notificationsDataDate = await parseWmbDatesFor(
    notificationsFiles,
    notificationsWmbFiles
  );

  return {
    apartments,
    chargeEntries,
    notificationData,
    paymentData,
    duplicateErrors,
  };
}
