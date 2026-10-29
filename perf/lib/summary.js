import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

const RESULTS_DIR = __ENV.PERF_RESULTS_DIR || 'perf-results';

function formatMs(value) {
  return value === undefined ? '-' : `${value.toFixed(1)} ms`;
}

function thresholdRows(metrics) {
  return Object.entries(metrics).flatMap(([name, metric]) =>
    Object.entries(metric.thresholds || {}).map(([expr, { ok }]) => {
      const v = metric.values;
      const observed =
        metric.type === 'trend'
          ? `avg ${formatMs(v.avg)}, p95 ${formatMs(v['p(95)'])}, max ${formatMs(v.max)}`
          : `${((v.rate ?? 0) * 100).toFixed(2)}%`;
      return `| ${ok ? '✅' : '❌'} | \`${name}\` | \`${expr}\` | ${observed} |`;
    })
  );
}

function markdownSummary(data) {
  const { metrics } = data;
  return [
    '## Performance test results',
    '',
    `Requests: **${metrics.http_reqs.values.count}** ` +
      `(${metrics.http_reqs.values.rate.toFixed(1)}/s), ` +
      `iterations: **${metrics.iterations.values.count}**`,
    '',
    '| | Metric | Threshold | Observed |',
    '| --- | --- | --- | --- |',
    ...thresholdRows(metrics),
    '',
  ].join('\n');
}

export function buildSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [`${RESULTS_DIR}/summary.json`]: JSON.stringify(data, null, 2),
    [`${RESULTS_DIR}/summary.md`]: markdownSummary(data),
  };
}
