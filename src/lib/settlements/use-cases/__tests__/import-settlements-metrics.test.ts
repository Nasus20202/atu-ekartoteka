import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  mocks,
  resetImportMocks,
  upload,
} from '@/__tests__/helpers/settlement-import/import-mocks';
import { utilityDocument } from '@/__tests__/helpers/settlement-pdf/documents';
import { importMetrics } from '@/lib/platform/opentelemetry/import-metrics';
import { importSettlements } from '@/lib/settlements/use-cases/import-settlements';

describe('settlement import metrics', () => {
  beforeEach(() => {
    resetImportMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('counts the stored records of an imported file as a success', async () => {
    const recordRun = vi.spyOn(importMetrics, 'recordRun');
    const recordRecords = vi.spyOn(importMetrics, 'recordRecords');

    await importSettlements([upload('a.pdf')], []);

    expect(recordRun).toHaveBeenCalledWith(
      'settlement',
      'success',
      expect.any(Number)
    );
    expect(recordRecords).toHaveBeenCalledWith('settlement', {
      entity: 'utility_settlement',
      action: 'created',
      count: 1,
    });
  });

  it('counts a record that is already stored as unchanged', async () => {
    mocks.parse.mockResolvedValue(utilityDocument());
    mocks.stored.mockResolvedValue(utilityDocument().records[0]);
    const recordRecords = vi.spyOn(importMetrics, 'recordRecords');

    await importSettlements([upload('a.pdf')], []);

    expect(recordRecords).toHaveBeenCalledWith('settlement', {
      entity: 'utility_settlement',
      action: 'unchanged',
      count: 1,
    });
  });

  it('counts a file that could not be saved as a failure with no records', async () => {
    mocks.save.mockRejectedValue(new Error('unique'));
    const recordRun = vi.spyOn(importMetrics, 'recordRun');
    const recordRecords = vi.spyOn(importMetrics, 'recordRecords');
    const recordFinding = vi.spyOn(importMetrics, 'recordFinding');

    await importSettlements([upload('a.pdf')], []);

    expect(recordRun).toHaveBeenCalledWith(
      'settlement',
      'failure',
      expect.any(Number)
    );
    expect(recordRecords).not.toHaveBeenCalled();
    expect(recordFinding).toHaveBeenCalledTimes(1);
    expect(recordFinding).toHaveBeenCalledWith('settlement', {
      severity: 'error',
      kind: 'database',
    });
  });

  it('counts a file that was rejected alongside an imported one as partial', async () => {
    mocks.parse
      .mockResolvedValueOnce(
        utilityDocument({ period: ['01/10/2022', '31/12/2022'], total: 'x' })
      )
      .mockResolvedValueOnce(utilityDocument());
    const recordRun = vi.spyOn(importMetrics, 'recordRun');

    await importSettlements([upload('bad.pdf'), upload('good.pdf')], []);

    expect(recordRun).toHaveBeenCalledWith(
      'settlement',
      'partial',
      expect.any(Number)
    );
  });
});
