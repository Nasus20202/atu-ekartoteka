/**
 * Reads what the app exported over OTLP/HTTP (JSON) to the mock collector and
 * flattens it into spans, log records and metric data points.
 */

import type { APIRequestContext } from '@playwright/test';

import { MOCK_ENDPOINT_PATHS } from '../config/endpoints';
import type { OtlpSignal } from '../mocks/constants';
import { MOCK_URL } from './mock-server';

const SERVICE_NAME_KEY = 'service.name';

// OTLP severity numbers come in bands of four, starting at TRACE = 1
const SEVERITY_BANDS: [number, string][] = [
  [1, 'TRACE'],
  [5, 'DEBUG'],
  [9, 'INFO'],
  [13, 'WARN'],
  [17, 'ERROR'],
  [21, 'FATAL'],
];

function severityName(record: RawLogRecord): string {
  if (record.severityText) return record.severityText.toUpperCase();
  const number = record.severityNumber ?? 0;
  const band = SEVERITY_BANDS.filter(([start]) => number >= start).pop();
  return band?.[1] ?? '';
}

interface AnyValue {
  stringValue?: string;
  intValue?: string | number;
  doubleValue?: number;
  boolValue?: boolean;
}
interface KeyValue {
  key: string;
  value?: AnyValue;
}
interface Resource {
  resource?: { attributes?: KeyValue[] };
}
interface RawSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind?: number;
  attributes?: KeyValue[];
}
interface RawLogRecord {
  traceId?: string;
  severityNumber?: number;
  severityText?: string;
  body?: AnyValue;
  attributes?: KeyValue[];
}
interface RawPoint {
  attributes?: KeyValue[];
  asInt?: string | number;
  asDouble?: number;
}
interface RawMetric {
  name: string;
  gauge?: { dataPoints: RawPoint[] };
  sum?: { dataPoints: RawPoint[] };
}

interface TraceExport {
  resourceSpans: (Resource & {
    scopeSpans: { scope?: { name?: string }; spans: RawSpan[] }[];
  })[];
}
interface LogExport {
  resourceLogs: (Resource & { scopeLogs: { logRecords: RawLogRecord[] }[] })[];
}
interface MetricExport {
  resourceMetrics: (Resource & { scopeMetrics: { metrics: RawMetric[] }[] })[];
}

export interface CapturedSpan {
  /** Name of the instrumentation that created the span, e.g. `next.js` */
  scope: string;
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId: string;
  kind: number;
  serviceName: string;
  attributes: Record<string, string>;
}
export interface CapturedLog {
  body: string;
  severity: string;
  traceId: string;
  serviceName: string;
  attributes: Record<string, string>;
}
export interface CapturedMetric {
  name: string;
  points: { attributes: Record<string, string>; value: number }[];
}

function attributeValue(value: AnyValue | undefined): string {
  return String(
    value?.stringValue ??
      value?.intValue ??
      value?.doubleValue ??
      value?.boolValue ??
      ''
  );
}

function attributeMap(attributes: KeyValue[] = []): Record<string, string> {
  return Object.fromEntries(
    attributes.map(({ key, value }) => [key, attributeValue(value)])
  );
}

async function fetchExports<T>(
  request: APIRequestContext,
  signal: OtlpSignal
): Promise<T[]> {
  const response = await request.get(
    `${MOCK_URL}${MOCK_ENDPOINT_PATHS.otlp}/captured/${signal}`
  );
  return (await response.json()) as T[];
}

export async function listSpans(
  request: APIRequestContext
): Promise<CapturedSpan[]> {
  const exports = await fetchExports<TraceExport>(request, 'traces');
  return exports.flatMap((exported) =>
    exported.resourceSpans.flatMap((resourceSpans) => {
      const serviceName =
        attributeMap(resourceSpans.resource?.attributes)[SERVICE_NAME_KEY] ??
        '';
      return resourceSpans.scopeSpans.flatMap((scope) =>
        scope.spans.map((span) => ({
          name: span.name,
          traceId: span.traceId,
          spanId: span.spanId,
          parentSpanId: span.parentSpanId ?? '',
          kind: span.kind ?? 0,
          scope: scope.scope?.name ?? '',
          serviceName,
          attributes: attributeMap(span.attributes),
        }))
      );
    })
  );
}

export async function listLogs(
  request: APIRequestContext
): Promise<CapturedLog[]> {
  const exports = await fetchExports<LogExport>(request, 'logs');
  return exports.flatMap((exported) =>
    exported.resourceLogs.flatMap((resourceLogs) => {
      const serviceName =
        attributeMap(resourceLogs.resource?.attributes)[SERVICE_NAME_KEY] ?? '';
      return resourceLogs.scopeLogs.flatMap((scope) =>
        scope.logRecords.map((record) => ({
          body: attributeValue(record.body),
          severity: severityName(record),
          traceId: record.traceId ?? '',
          serviceName,
          attributes: attributeMap(record.attributes),
        }))
      );
    })
  );
}

export async function listMetrics(
  request: APIRequestContext
): Promise<CapturedMetric[]> {
  const exports = await fetchExports<MetricExport>(request, 'metrics');
  return exports.flatMap((exported) =>
    exported.resourceMetrics.flatMap((resourceMetrics) =>
      resourceMetrics.scopeMetrics.flatMap((scope) =>
        scope.metrics.map((metric) => ({
          name: metric.name,
          points: (
            metric.gauge?.dataPoints ??
            metric.sum?.dataPoints ??
            []
          ).map((point) => ({
            attributes: attributeMap(point.attributes),
            value: Number(point.asInt ?? point.asDouble ?? 0),
          })),
        }))
      )
    )
  );
}
