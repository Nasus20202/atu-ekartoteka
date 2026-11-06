/**
 * Waiting and matching helpers for the OpenTelemetry specs. Reading the exports
 * lives in ./otlp-capture.
 */

import { expect } from '@playwright/test';

import type { CapturedMetric } from './otlp-capture';

const SECOND_MS = 1000;
export const EXPORT_TIMEOUT_MS = 20 * SECOND_MS;
// Metrics are pushed every 60 seconds, so the first export can take a minute
export const METRIC_EXPORT_TIMEOUT_MS = 90 * SECOND_MS;

export const SERVICE_NAME = 'atu-ekartoteka';
export const SERVER_SPAN_KIND = 2;
// Scope of the spans created by HttpInstrumentation, as opposed to Next's own spans
export const HTTP_INSTRUMENTATION_SCOPE = '@opentelemetry/instrumentation-http';
export const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/;

/** Polls until `read` returns a value, then returns it. */
export async function pollUntil<T>(
  read: () => Promise<T | undefined>,
  timeout: number
): Promise<T> {
  let found: T | undefined;
  await expect
    .poll(
      async () => {
        found = await read();
        return found !== undefined;
      },
      { timeout, message: 'OTLP export' }
    )
    .toBe(true);
  return found as T;
}

/**
 * Value of the most recent point with these attributes. Gauges report the current
 * state, and the mock keeps every export, so the last one is the current value.
 */
export function latestPointValue(
  metrics: CapturedMetric[],
  name: string,
  attributes: Record<string, string>
): number | undefined {
  let value: number | undefined;
  for (const metric of metrics) {
    if (metric.name !== name) continue;
    for (const point of metric.points) {
      if (
        Object.entries(attributes).every(
          ([key, expected]) => point.attributes[key] === expected
        )
      ) {
        value = point.value;
      }
    }
  }
  return value;
}

/** True when a metric has a point with these attributes that counted at least once. */
export function hasMetricPoint(
  metrics: CapturedMetric[],
  name: string,
  attributes: Record<string, string>
): boolean {
  return metrics.some(
    (metric) =>
      metric.name === name &&
      metric.points.some(
        (point) =>
          point.value >= 1 &&
          Object.entries(attributes).every(
            ([key, value]) => point.attributes[key] === value
          )
      )
  );
}
