import type { OtlpSignal } from './constants';

// OTLP/HTTP export bodies received so far, per signal, in arrival order
const exportsBySignal: Record<OtlpSignal, unknown[]> = {
  traces: [],
  metrics: [],
  logs: [],
};

export function addExport(signal: OtlpSignal, body: unknown): void {
  exportsBySignal[signal].push(body);
}

export function listExports(signal: OtlpSignal): unknown[] {
  return exportsBySignal[signal];
}
