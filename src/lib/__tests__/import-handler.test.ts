import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as apartmentImport from '@/lib/import/apartment-import';
import * as chargeImport from '@/lib/import/charge-import';
import { processBatchImport } from '@/lib/import/import-handler';

// Helper function to create mock File with arrayBuffer method
function createMockFile(content: string, name: string): File {
  const blob = new Blob([content], { type: 'text/plain' });
  const file = new File([blob], name, { type: 'text/plain' });
  // Mock arrayBuffer method
  Object.defineProperty(file, 'arrayBuffer', {
    value: () => Promise.resolve(new TextEncoder().encode(content).buffer),
  });
  return file;
}

describe('import-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processBatchImport', () => {
    it('should group files by HOA and process them', async () => {
      const lokFile = createMockFile('lok data', 'hoa1/lok.txt');
      const chargesFile = createMockFile('charges data', 'hoa1/nal_czynsz.txt');

      vi.spyOn(apartmentImport, 'importApartmentsFromBuffer').mockResolvedValue(
        {
          created: 5,
          updated: 2,
          deactivated: 1,
          total: 7,
          errors: [],
        }
      );

      vi.spyOn(chargeImport, 'importChargesFromBuffer').mockResolvedValue({
        created: 10,
        updated: 5,
        skipped: 2,
        total: 17,
        errors: [],
      });

      const result = await processBatchImport([lokFile, chargesFile]);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].hoaId).toBe('hoa1');
      expect(result.results[0].created).toBe(5);
      expect(result.results[0].charges?.created).toBe(10);
      expect(result.errors).toHaveLength(0);
      expect(chargeImport.importChargesFromBuffer).toHaveBeenCalledWith(
        expect.any(Buffer),
        'hoa1'
      );
    });

    it('should process multiple HOAs', async () => {
      const lokFile1 = createMockFile('lok data 1', 'hoa1/lok.txt');
      const lokFile2 = createMockFile('lok data 2', 'hoa2/lok.txt');

      vi.spyOn(
        apartmentImport,
        'importApartmentsFromBuffer'
      ).mockResolvedValueOnce({
        created: 5,
        updated: 2,
        deactivated: 1,
        total: 7,
        errors: [],
      });

      vi.spyOn(
        apartmentImport,
        'importApartmentsFromBuffer'
      ).mockResolvedValueOnce({
        created: 3,
        updated: 1,
        deactivated: 0,
        total: 4,
        errors: [],
      });

      const result = await processBatchImport([lokFile1, lokFile2]);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].hoaId).toBe('hoa1');
      expect(result.results[1].hoaId).toBe('hoa2');
    });

    it('should require lok.txt file', async () => {
      const chargesFile = createMockFile('charges data', 'hoa1/nal_czynsz.txt');

      const result = await processBatchImport([chargesFile]);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Brak pliku lok.txt');
    });

    it('should reject invalid file structure', async () => {
      const invalidFile = createMockFile('data', 'lok.txt');

      const result = await processBatchImport([invalidFile]);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Nieprawidłowa struktura');
    });

    it('should reject invalid file names', async () => {
      const invalidFile = createMockFile('data', 'hoa1/invalid.txt');

      const result = await processBatchImport([invalidFile]);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Nieprawidłowa nazwa pliku');
    });

    it('should handle import errors gracefully', async () => {
      const lokFile = createMockFile('lok data', 'hoa1/lok.txt');

      vi.spyOn(apartmentImport, 'importApartmentsFromBuffer').mockRejectedValue(
        new Error('Database error')
      );

      const result = await processBatchImport([lokFile]);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].hoaId).toBe('hoa1');
      expect(result.errors[0].error).toContain('Database error');
    });

    it('should process charges only if file is provided', async () => {
      const lokFile = createMockFile('lok data', 'hoa1/lok.txt');

      vi.spyOn(apartmentImport, 'importApartmentsFromBuffer').mockResolvedValue(
        {
          created: 5,
          updated: 2,
          deactivated: 1,
          total: 7,
          errors: [],
        }
      );

      const result = await processBatchImport([lokFile]);

      expect(result.success).toBe(true);
      expect(result.results[0].charges).toBeUndefined();
      expect(apartmentImport.importApartmentsFromBuffer).toHaveBeenCalledWith(
        expect.any(Buffer),
        'hoa1'
      );
      expect(chargeImport.importChargesFromBuffer).not.toHaveBeenCalled();
    });
  });
});
