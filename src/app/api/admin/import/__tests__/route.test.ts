import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gzipSync } from 'zlib';

import { UserRole } from '@/lib/types';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/import/import-handler', () => ({
  processBatchImport: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

const { auth } = await import('@/auth');
const { processBatchImport } = await import('@/lib/import/import-handler');

function createMockFormData(files: File[]): FormData {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return formData;
}

function createMockRequest(formData: FormData): NextRequest {
  return {
    formData: async () => formData,
    headers: {
      get: (name: string) => {
        if (name === 'content-type') return 'multipart/form-data';
        return null;
      },
    },
  } as NextRequest;
}

function createMockJsonRequest(body: any): NextRequest {
  return {
    json: async () => body,
    headers: {
      get: (name: string) => {
        if (name === 'content-type') return 'application/json';
        return null;
      },
    },
  } as NextRequest;
}

function createGzippedBase64File(
  content: string,
  filename: string
): { path: string; name: string; content: string } {
  const buffer = Buffer.from(content);
  const compressed = gzipSync(buffer);
  const base64 = compressed.toString('base64');
  return {
    path: filename,
    name: filename,
    content: base64,
  };
}

describe('Admin Import API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/admin/import', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);

      const { POST } = await import('../route');
      const formData = createMockFormData([]);
      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Brak uprawnień');
    });

    it('should return 401 when user is not admin', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      } as any);

      const { POST } = await import('../route');
      const formData = createMockFormData([]);
      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Brak uprawnień');
    });

    it('should return 400 when no files provided', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);

      const { POST } = await import('../route');
      const formData = createMockFormData([]);
      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Nie przesłano plików');
    });

    it('should process single file successfully', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);

      const mockResult = {
        results: [
          {
            hoaId: 'hoa-1',
            hoaName: 'Wspólnota A',
            success: true,
            apartmentsProcessed: 10,
          },
        ],
      };
      vi.mocked(processBatchImport).mockResolvedValueOnce(mockResult as any);

      const { POST } = await import('../route');
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const formData = createMockFormData([file]);
      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(processBatchImport).toHaveBeenCalledWith([file], {
        cleanImport: false,
      });
    });

    it('should process multiple files successfully', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);

      const mockResult = {
        results: [
          {
            hoaId: 'hoa-1',
            hoaName: 'Wspólnota A',
            success: true,
            apartmentsProcessed: 10,
          },
          {
            hoaId: 'hoa-2',
            hoaName: 'Wspólnota B',
            success: true,
            apartmentsProcessed: 5,
          },
        ],
      };
      vi.mocked(processBatchImport).mockResolvedValueOnce(mockResult as any);

      const { POST } = await import('../route');
      const file1 = new File(['content1'], 'test1.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const file2 = new File(['content2'], 'test2.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const formData = createMockFormData([file1, file2]);
      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(2);
      expect(processBatchImport).toHaveBeenCalledWith([file1, file2], {
        cleanImport: false,
      });
    });

    it('should handle import errors gracefully', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(processBatchImport).mockRejectedValueOnce(
        new Error('Invalid file format')
      );

      const { POST } = await import('../route');
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const formData = createMockFormData([file]);
      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Import nie powiódł się');
      expect(data.message).toBe('Invalid file format');
    });

    it('should return import results with correct structure', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);

      const mockResult = {
        results: [
          {
            hoaId: 'hoa-1',
            hoaName: 'Wspólnota A',
            success: true,
            apartmentsProcessed: 10,
            chargesProcessed: 100,
            paymentsProcessed: 50,
          },
        ],
      };
      vi.mocked(processBatchImport).mockResolvedValueOnce(mockResult as any);

      const { POST } = await import('../route');
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const formData = createMockFormData([file]);
      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('results');
      expect(data.results[0]).toHaveProperty('hoaId');
      expect(data.results[0]).toHaveProperty('hoaName');
      expect(data.results[0]).toHaveProperty('success');
      expect(data.results[0]).toHaveProperty('apartmentsProcessed');
    });

    it('should handle JSON format with gzipped base64 files', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);

      const mockResult = {
        results: [
          {
            hoaId: 'KLO11',
            created: 2,
            updated: 0,
            deactivated: 0,
            total: 2,
            errors: [],
          },
        ],
        errors: [],
      };
      vi.mocked(processBatchImport).mockResolvedValueOnce(mockResult as any);

      const { POST } = await import('../route');
      const file1 = createGzippedBase64File(
        'test content 1',
        'data/KLO11/lok.txt'
      );
      const file2 = createGzippedBase64File(
        'test content 2',
        'data/KLO11/nal_czynsz.txt'
      );
      const request = createMockJsonRequest({ files: [file1, file2] });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(processBatchImport).toHaveBeenCalled();
      const calledFiles = vi.mocked(processBatchImport).mock.calls[0][0];
      expect(calledFiles).toHaveLength(2);
      expect(calledFiles[0].name).toBe('data/KLO11/lok.txt');
    });

    it('should return 400 when no files in JSON format', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);

      const { POST } = await import('../route');
      const request = createMockJsonRequest({ files: [] });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Nie przesłano plików');
    });

    it('should handle partial import failures', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);

      const mockResult = {
        results: [
          {
            hoaId: 'hoa-1',
            hoaName: 'Wspólnota A',
            success: true,
            apartmentsProcessed: 10,
          },
          {
            hoaId: 'hoa-2',
            hoaName: 'Wspólnota B',
            success: false,
            error: 'Invalid data',
          },
        ],
      };
      vi.mocked(processBatchImport).mockResolvedValueOnce(mockResult as any);

      const { POST } = await import('../route');
      const file1 = new File(['content1'], 'test1.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const file2 = new File(['content2'], 'test2.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const formData = createMockFormData([file1, file2]);
      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(2);
      expect(data.results[0].success).toBe(true);
      expect(data.results[1].success).toBe(false);
    });
  });
});
