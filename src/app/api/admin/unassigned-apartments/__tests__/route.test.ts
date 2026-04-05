import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '@/lib/types';

const mockAuth = vi.fn();
const mockApartmentFindMany = vi.fn();

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    apartment: {
      findMany: mockApartmentFindMany,
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

const mockApartments = [
  {
    id: 'apt-1',
    number: '101',
    building: 'A',
    owner: 'Jan Kowalski',
    email: 'jan@example.com',
    homeownersAssociation: { id: 'hoa-1', name: 'Wspólnota Alfa' },
  },
  {
    id: 'apt-2',
    number: '102',
    building: 'A',
    owner: 'Anna Nowak',
    email: 'anna@example.com',
    homeownersAssociation: { id: 'hoa-1', name: 'Wspólnota Alfa' },
  },
  {
    id: 'apt-3',
    number: '201',
    building: 'B',
    owner: 'Piotr Wiśniewski',
    email: 'piotr@example.com',
    homeownersAssociation: { id: 'hoa-2', name: 'Wspólnota Beta' },
  },
];

describe('GET /api/admin/unassigned-apartments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import('../route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Brak uprawnień');
  });

  it('should return 401 when user is not admin', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-id', email: 'user@example.com', role: UserRole.TENANT },
      expires: new Date().toISOString(),
    });

    const { GET } = await import('../route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Brak uprawnień');
  });

  it('should return apartments grouped by HOA', async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: 'admin-id',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      },
      expires: new Date().toISOString(),
    });
    mockApartmentFindMany.mockResolvedValueOnce(mockApartments);

    const { GET } = await import('../route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hoas).toHaveLength(2);

    const hoa1 = data.hoas.find((h: { hoaId: string }) => h.hoaId === 'hoa-1');
    expect(hoa1).toBeDefined();
    expect(hoa1.hoaName).toBe('Wspólnota Alfa');
    expect(hoa1.apartments).toHaveLength(2);

    const hoa2 = data.hoas.find((h: { hoaId: string }) => h.hoaId === 'hoa-2');
    expect(hoa2).toBeDefined();
    expect(hoa2.hoaName).toBe('Wspólnota Beta');
    expect(hoa2.apartments).toHaveLength(1);
  });

  it('should return empty hoas array when no unassigned apartments', async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: 'admin-id',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      },
      expires: new Date().toISOString(),
    });
    mockApartmentFindMany.mockResolvedValueOnce([]);

    const { GET } = await import('../route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hoas).toEqual([]);
  });

  it('should query with correct filters', async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: 'admin-id',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      },
      expires: new Date().toISOString(),
    });
    mockApartmentFindMany.mockResolvedValueOnce([]);

    const { GET } = await import('../route');
    await GET();

    expect(mockApartmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: null, email: { not: null } },
      })
    );
  });

  it('should handle database errors gracefully', async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: 'admin-id',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      },
      expires: new Date().toISOString(),
    });
    mockApartmentFindMany.mockRejectedValueOnce(new Error('DB failure'));

    const { GET } = await import('../route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});
