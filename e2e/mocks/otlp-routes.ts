import { OTLP_SIGNALS, type OtlpSignal } from './constants';
import {
  HTTP_BAD_REQUEST,
  HTTP_OK,
  notFound,
  readBody,
  type RouteContext,
  sendJson,
} from './http';
import { createMockLogger } from './logger';
import { addExport, listExports } from './otlp-store';

const log = createMockLogger('mock:otlp');

type Json = Record<string, unknown>;

// The JSON path of each signal's list of resources, scopes and records
const RECORD_PATHS: Record<OtlpSignal, [string, string, string]> = {
  traces: ['resourceSpans', 'scopeSpans', 'spans'],
  metrics: ['resourceMetrics', 'scopeMetrics', 'metrics'],
  logs: ['resourceLogs', 'scopeLogs', 'logRecords'],
};

function countRecords(signal: OtlpSignal, body: Json): number {
  const [resourceKey, scopeKey, recordKey] = RECORD_PATHS[signal];
  const resources = (body[resourceKey] ?? []) as Json[];
  return resources.reduce(
    (total, resource) =>
      total +
      ((resource[scopeKey] ?? []) as Json[]).reduce(
        (sum, scope) => sum + ((scope[recordKey] ?? []) as unknown[]).length,
        0
      ),
    0
  );
}

// The app exports to `{endpoint}/v1/{signal}` and the tests read `/captured/{signal}`
const INGEST_PREFIX = '/v1/';
const CAPTURED_PREFIX = '/captured/';

function toSignal(value: string): OtlpSignal | undefined {
  return (OTLP_SIGNALS as readonly string[]).includes(value)
    ? (value as OtlpSignal)
    : undefined;
}

export async function handleOtlp({
  req,
  res,
  route,
}: RouteContext): Promise<void> {
  if (route.startsWith(INGEST_PREFIX) && req.method === 'POST') {
    const signal = toSignal(route.slice(INGEST_PREFIX.length));
    if (!signal) return notFound(res);
    let body: Json;
    try {
      body = JSON.parse(await readBody(req)) as Json;
    } catch {
      return sendJson(res, HTTP_BAD_REQUEST, {
        error: 'expected OTLP/HTTP JSON',
      });
    }
    addExport(signal, body);
    log.info({ signal, records: countRecords(signal, body) }, 'OTLP export');
    return sendJson(res, HTTP_OK, {});
  }

  if (route.startsWith(CAPTURED_PREFIX) && req.method === 'GET') {
    const signal = toSignal(route.slice(CAPTURED_PREFIX.length));
    if (!signal) return notFound(res);
    return sendJson(res, HTTP_OK, listExports(signal));
  }

  notFound(res);
}
