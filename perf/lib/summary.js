import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

const RESULTS_DIR = __ENV.PERF_RESULTS_DIR || 'perf-results';
const BYTES_PER_MB = 1024 * 1024;

function formatMs(value) {
  return value === undefined ? '-' : `${value.toFixed(1)} ms`;
}

function observed(metric) {
  const v = metric.values;
  if (metric.type === 'trend') {
    return `avg ${formatMs(v.avg)}, p95 ${formatMs(v['p(95)'])}, p99 ${formatMs(v['p(99)'])}, max ${formatMs(v.max)}`;
  }
  if (metric.type === 'rate') return `${((v.rate ?? 0) * 100).toFixed(2)}%`;
  return `${v.count ?? 0}`;
}

function thresholdRows(metrics) {
  return Object.entries(metrics).flatMap(([name, metric]) =>
    Object.entries(metric.thresholds || {}).map(
      ([expr, { ok }]) =>
        `| ${ok ? '✅' : '❌'} | \`${name}\` | \`${expr}\` | ${observed(metric)} |`
    )
  );
}

function value(metrics, name, key) {
  return metrics[name]?.values?.[key] ?? 0;
}

function overviewRows(metrics, load) {
  return [
    ...Object.entries(load).map(
      ([label, peak]) => `| Peak ${label} | ${peak} |`
    ),
    `| Requests | ${value(metrics, 'http_reqs', 'count')} (${value(metrics, 'http_reqs', 'rate').toFixed(1)}/s) |`,
    `| Iterations | ${value(metrics, 'iterations', 'count')} |`,
    `| Dropped iterations | ${value(metrics, 'dropped_iterations', 'count')} |`,
    `| Max VUs | ${value(metrics, 'vus', 'max')} |`,
    `| Time to first byte p95 | ${formatMs(metrics.http_req_waiting?.values['p(95)'])} |`,
    `| Data received | ${(value(metrics, 'data_received', 'count') / BYTES_PER_MB).toFixed(1)} MB |`,
  ];
}

function markdownSummary(data, load) {
  const { metrics } = data;
  return [
    '## Performance test results',
    '',
    '| | |',
    '| --- | --- |',
    ...overviewRows(metrics, load),
    '',
    '| | Metric | Threshold | Observed |',
    '| --- | --- | --- | --- |',
    ...thresholdRows(metrics),
    '',
  ].join('\n');
}

export function buildSummary(data, load) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [`${RESULTS_DIR}/summary.json`]: JSON.stringify(data, null, 2),
    [`${RESULTS_DIR}/summary.md`]: markdownSummary(data, load),
  };
}
