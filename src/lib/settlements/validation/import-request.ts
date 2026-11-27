import type {
  EncodedFile,
  SettlementConfirmation,
} from '@/lib/settlements/dto/settlement-import-dto';
import type {
  ConfirmationReason,
  SettlementImportOptions,
} from '@/lib/settlements/types/prepared-file';

export interface SettlementRequest {
  files: EncodedFile[];
  confirmations: SettlementConfirmation[];
  options: SettlementImportOptions;
}

const REASONS: ConfirmationReason[] = ['owner-annotation', 'replace'];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isFile = (value: unknown): value is EncodedFile =>
  isObject(value) &&
  typeof value.name === 'string' &&
  value.name !== '' &&
  typeof value.content === 'string';

const isConfirmation = (value: unknown): value is SettlementConfirmation =>
  isObject(value) &&
  typeof value.key === 'string' &&
  REASONS.includes(value.reason as ConfirmationReason);

/** The request body, or null when it does not have the expected shape. */
export function readSettlementRequest(body: unknown): SettlementRequest | null {
  if (!isObject(body)) return null;
  const {
    files,
    confirmations = [],
    cleanImport = false,
    skipValidation = false,
  } = body;
  const valid =
    typeof cleanImport === 'boolean' &&
    typeof skipValidation === 'boolean' &&
    Array.isArray(files) &&
    files.length > 0 &&
    files.every(isFile) &&
    Array.isArray(confirmations) &&
    confirmations.every(isConfirmation);

  return valid
    ? { files, confirmations, options: { cleanImport, skipValidation } }
    : null;
}
