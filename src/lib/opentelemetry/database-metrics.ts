/**
 * Database Custom Metrics
 *
 * Tracks counts of objects in the database for monitoring and observability.
 * Uses a single metric with table name as dimension.
 *
 * NOTE: Logger is imported lazily to ensure OpenTelemetry SDK is started
 * before Pino is loaded, allowing PinoInstrumentation to hook in properly.
 */

import type { Meter } from '@opentelemetry/api';

import { prisma } from '@/lib/database/prisma';

const TABLE_COUNTS = {
  homeownersAssociation: () => prisma.homeownersAssociation.count(),
  apartment: () => prisma.apartment.count(),
  charge: () => prisma.charge.count(),
  chargeNotification: () => prisma.chargeNotification.count(),
  payment: () => prisma.payment.count(),
  user: () => prisma.user.count(),
} as const;

export async function registerDatabaseMetrics(meter: Meter) {
  const dbSizeGauge = meter.createObservableGauge('ekartoteka.db.size', {
    description: 'Number of rows in database tables',
  });

  // Cache for storing the latest counts
  const tableCounts: Record<string, number> = {};

  // Background task to update counts periodically
  async function updateCounts() {
    for (const [table, countFn] of Object.entries(TABLE_COUNTS)) {
      tableCounts[table] = await countFn();
    }
  }

  // Initial count
  await updateCounts();

  // Update counts every 30 seconds
  setInterval(updateCounts, 30_000);

  // Synchronous callback that reads from cache
  dbSizeGauge.addCallback((result) => {
    for (const [table, count] of Object.entries(tableCounts)) {
      result.observe(count, { table });
    }
  });
}
