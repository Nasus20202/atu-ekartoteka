import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/import/importers', () => ({
  importApartments: vi.fn().mockResolvedValue({ map: { map: new Map() } }),
  importCharges: vi.fn(),
  importNotifications: vi.fn(),
  importPayments: vi.fn(),
}));
vi.mock('@/lib/import/validation/skipped-records', () => ({
  buildSkippedRecordWarnings: () => [],
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => ({ info: vi.fn() }),
}));

import { importHoaInTransaction } from '@/lib/import/pipeline/import-hoa-transaction';
import type { TransactionClient } from '@/lib/import/types/import-context';

describe('clean text import', () => {
  it('deletes only the data that the text files replace', async () => {
    const deleted: string[] = [];
    // Records every model whose rows the transaction deletes
    const tx = new Proxy({} as TransactionClient, {
      get: (_, model: string) => ({
        upsert: () => Promise.resolve({ id: 'hoa-1' }),
        deleteMany: () => {
          deleted.push(model);
          return Promise.resolve({ count: 0 });
        },
      }),
    });

    await importHoaInTransaction(
      tx,
      'TST01',
      { apartments: [] } as never,
      { errors: [], warnings: [] } as never,
      { cleanImport: true }
    );

    // Settlements and the apartments they belong to are kept
    expect(deleted).toEqual(['charge', 'chargeNotification', 'payment']);
  });
});
