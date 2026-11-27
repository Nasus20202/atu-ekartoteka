import { NextRequest, NextResponse } from 'next/server';

import { decodeUpload } from '@/lib/settlements/parsers/decode-upload';
import type { SettlementUpload } from '@/lib/settlements/types/prepared-file';
import { readSettlementRequest } from '@/lib/settlements/validation/import-request';

// Far above any batch of printouts; stops a mistaken or runaway upload
const MAX_BODY_BYTES = 200 * 1024 * 1024;
const PAYLOAD_TOO_LARGE = 413;

const badRequest = (error: string) =>
  NextResponse.json({ error }, { status: 400 });

/** The uploads, confirmations and options, or the response that rejects them. */
export async function readUploadRequest(req: NextRequest) {
  if (Number(req.headers.get('content-length')) > MAX_BODY_BYTES) {
    return {
      response: NextResponse.json(
        { error: 'Przesłane pliki są zbyt duże' },
        { status: PAYLOAD_TOO_LARGE }
      ),
    };
  }

  const request = readSettlementRequest(await req.json().catch(() => null));
  if (!request) {
    return { response: badRequest('Nie przesłano plików') };
  }

  const uploads: SettlementUpload[] = [];
  for (const file of request.files) {
    const upload = decodeUpload(file);
    if (!upload) {
      return { response: badRequest('Nie można odczytać przesłanych plików') };
    }
    uploads.push(upload);
  }

  const { confirmations, options } = request;
  return { uploads, confirmations, options };
}
