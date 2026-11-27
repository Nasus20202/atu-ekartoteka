import { gunzipSync } from 'node:zlib';

import type { EncodedFile } from '@/lib/settlements/dto/settlement-import-dto';
import type { SettlementUpload } from '@/lib/settlements/types/prepared-file';

// Far above any printout; stops a small upload from expanding without limit
const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** The file as uploaded, or null when it cannot be decompressed. */
export function decodeUpload({
  name,
  content,
}: EncodedFile): SettlementUpload | null {
  try {
    const data = gunzipSync(Buffer.from(content, 'base64'), {
      maxOutputLength: MAX_FILE_BYTES,
    });
    return { fileName: name, data };
  } catch {
    return null;
  }
}
