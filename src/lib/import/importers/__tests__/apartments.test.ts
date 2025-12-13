import { beforeEach, describe, expect, it, vi } from 'vitest';

import { importApartments } from '@/lib/import/importers/apartments';
import { EntityStats, HOAContext, TransactionClient } from '@/lib/import/types';
import { ApartmentEntry } from '@/lib/parsers/apartment-parser';

function createMockTx() {
  return {
    apartment: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  } as unknown as TransactionClient;
}

function createMockHoa(id = 'hoa-1'): HOAContext {
  return { id, externalId: 'TEST01' };
}

function createStats(): EntityStats {
  return { total: 0, created: 0, updated: 0, skipped: 0, deleted: 0 };
}

function createApartmentEntry(
  overrides: Partial<ApartmentEntry> = {}
): ApartmentEntry {
  return {
    externalOwnerId: 'W001',
    externalApartmentId: 'APT001',
    owner: 'Test Owner',
    email: 'test@example.com',
    address: 'Test Street 1',
    building: 'A',
    number: '1',
    postalCode: '00-001',
    city: 'Warsaw',
    shareNumerator: 1,
    shareDenominator: 100,
    isOwner: true,
    ...overrides,
  };
}

describe('importApartments', () => {
  let mockTx: ReturnType<typeof createMockTx>;
  let hoa: HOAContext;
  let stats: EntityStats;
  let errors: string[];

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = createMockTx();
    hoa = createMockHoa();
    stats = createStats();
    errors = [];
  });

  it('should create new apartments', async () => {
    const apartments = [createApartmentEntry()];

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([]) // existing apartments
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]); // after creation

    (mockTx.apartment.createMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      { count: 1 }
    );

    const result = await importApartments(
      mockTx,
      hoa,
      apartments,
      stats,
      errors
    );

    expect(stats.created).toBe(1);
    expect(mockTx.apartment.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          externalOwnerId: 'W001',
          externalApartmentId: 'APT001',
          owner: 'Test Owner',
          email: 'test@example.com',
          isActive: true,
          homeownersAssociationId: 'hoa-1',
        }),
      ],
      skipDuplicates: true,
    });
    expect(result.map.get('W001#APT001')).toBe('apt-1');
  });

  it('should update changed apartments', async () => {
    const apartments = [createApartmentEntry({ owner: 'Updated Owner' })];

    const existingApartment = {
      id: 'apt-1',
      externalOwnerId: 'W001',
      externalApartmentId: 'APT001',
      owner: 'Old Owner',
      email: 'test@example.com',
      address: 'Test Street 1',
      building: 'A',
      number: '1',
      postalCode: '00-001',
      city: 'Warsaw',
      shareNumerator: 1,
      shareDenominator: 100,
      isActive: true,
      homeownersAssociationId: 'hoa-1',
    };

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingApartment])
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]);

    (mockTx.apartment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(stats.updated).toBe(1);
    expect(mockTx.apartment.update).toHaveBeenCalledWith({
      where: { id: 'apt-1' },
      data: expect.objectContaining({
        owner: 'Updated Owner',
      }),
    });
  });

  it('should not update unchanged apartments', async () => {
    const apartments = [createApartmentEntry()];

    const existingApartment = {
      id: 'apt-1',
      externalOwnerId: 'W001',
      externalApartmentId: 'APT001',
      owner: 'Test Owner',
      email: 'test@example.com',
      address: 'Test Street 1',
      building: 'A',
      number: '1',
      postalCode: '00-001',
      city: 'Warsaw',
      shareNumerator: 1,
      shareDenominator: 100,
      isActive: true,
      homeownersAssociationId: 'hoa-1',
    };

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingApartment])
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]);

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(stats.updated).toBe(0);
    expect(mockTx.apartment.update).not.toHaveBeenCalled();
  });

  it('should deactivate apartments not in file', async () => {
    const apartments = [createApartmentEntry()];

    const existingApartments = [
      {
        id: 'apt-1',
        externalOwnerId: 'W001',
        externalApartmentId: 'APT001',
        owner: 'Test Owner',
        email: 'test@example.com',
        address: 'Test Street 1',
        building: 'A',
        number: '1',
        postalCode: '00-001',
        city: 'Warsaw',
        shareNumerator: 1,
        shareDenominator: 100,
        isActive: true,
        homeownersAssociationId: 'hoa-1',
      },
      {
        id: 'apt-2',
        externalOwnerId: 'W002',
        externalApartmentId: 'APT002',
        owner: 'Other Owner',
        email: null,
        address: null,
        building: null,
        number: '2',
        postalCode: null,
        city: null,
        shareNumerator: null,
        shareDenominator: null,
        isActive: true,
        homeownersAssociationId: 'hoa-1',
      },
    ];

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(existingApartments)
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]);

    (mockTx.apartment.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      { count: 1 }
    );

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(stats.deleted).toBe(1);
    expect(mockTx.apartment.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['apt-2'] } },
      data: { isActive: false },
    });
  });

  it('should handle create errors gracefully', async () => {
    const apartments = [createApartmentEntry()];

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    (mockTx.apartment.createMany as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('DB error')
    );

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Błąd tworzenia mieszkań');
    expect(stats.skipped).toBe(1);
  });

  it('should handle update errors gracefully', async () => {
    const apartments = [createApartmentEntry({ owner: 'Updated' })];

    const existingApartment = {
      id: 'apt-1',
      externalOwnerId: 'W001',
      externalApartmentId: 'APT001',
      owner: 'Old Owner',
      email: 'test@example.com',
      address: 'Test Street 1',
      building: 'A',
      number: '1',
      postalCode: '00-001',
      city: 'Warsaw',
      shareNumerator: 1,
      shareDenominator: 100,
      isActive: true,
      homeownersAssociationId: 'hoa-1',
    };

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingApartment])
      .mockResolvedValueOnce([]);

    (mockTx.apartment.update as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Update failed')
    );

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Błąd aktualizacji mieszkania');
    expect(stats.skipped).toBe(1);
  });

  it('should detect changes in email', async () => {
    const apartments = [createApartmentEntry({ email: 'new@example.com' })];

    const existingApartment = {
      id: 'apt-1',
      externalOwnerId: 'W001',
      externalApartmentId: 'APT001',
      owner: 'Test Owner',
      email: 'old@example.com',
      address: 'Test Street 1',
      building: 'A',
      number: '1',
      postalCode: '00-001',
      city: 'Warsaw',
      shareNumerator: 1,
      shareDenominator: 100,
      isActive: true,
      homeownersAssociationId: 'hoa-1',
    };

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingApartment])
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]);

    (mockTx.apartment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in address', async () => {
    const apartments = [createApartmentEntry({ address: 'New Street 2' })];

    const existingApartment = {
      id: 'apt-1',
      externalOwnerId: 'W001',
      externalApartmentId: 'APT001',
      owner: 'Test Owner',
      email: 'test@example.com',
      address: 'Test Street 1',
      building: 'A',
      number: '1',
      postalCode: '00-001',
      city: 'Warsaw',
      shareNumerator: 1,
      shareDenominator: 100,
      isActive: true,
      homeownersAssociationId: 'hoa-1',
    };

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingApartment])
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]);

    (mockTx.apartment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in building', async () => {
    const apartments = [createApartmentEntry({ building: 'B' })];

    const existingApartment = {
      id: 'apt-1',
      externalOwnerId: 'W001',
      externalApartmentId: 'APT001',
      owner: 'Test Owner',
      email: 'test@example.com',
      address: 'Test Street 1',
      building: 'A',
      number: '1',
      postalCode: '00-001',
      city: 'Warsaw',
      shareNumerator: 1,
      shareDenominator: 100,
      isActive: true,
      homeownersAssociationId: 'hoa-1',
    };

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingApartment])
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]);

    (mockTx.apartment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in number', async () => {
    const apartments = [createApartmentEntry({ number: '99' })];

    const existingApartment = {
      id: 'apt-1',
      externalOwnerId: 'W001',
      externalApartmentId: 'APT001',
      owner: 'Test Owner',
      email: 'test@example.com',
      address: 'Test Street 1',
      building: 'A',
      number: '1',
      postalCode: '00-001',
      city: 'Warsaw',
      shareNumerator: 1,
      shareDenominator: 100,
      isActive: true,
      homeownersAssociationId: 'hoa-1',
    };

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingApartment])
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]);

    (mockTx.apartment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in postalCode', async () => {
    const apartments = [createApartmentEntry({ postalCode: '99-999' })];

    const existingApartment = {
      id: 'apt-1',
      externalOwnerId: 'W001',
      externalApartmentId: 'APT001',
      owner: 'Test Owner',
      email: 'test@example.com',
      address: 'Test Street 1',
      building: 'A',
      number: '1',
      postalCode: '00-001',
      city: 'Warsaw',
      shareNumerator: 1,
      shareDenominator: 100,
      isActive: true,
      homeownersAssociationId: 'hoa-1',
    };

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingApartment])
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]);

    (mockTx.apartment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in city', async () => {
    const apartments = [createApartmentEntry({ city: 'Krakow' })];

    const existingApartment = {
      id: 'apt-1',
      externalOwnerId: 'W001',
      externalApartmentId: 'APT001',
      owner: 'Test Owner',
      email: 'test@example.com',
      address: 'Test Street 1',
      building: 'A',
      number: '1',
      postalCode: '00-001',
      city: 'Warsaw',
      shareNumerator: 1,
      shareDenominator: 100,
      isActive: true,
      homeownersAssociationId: 'hoa-1',
    };

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingApartment])
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]);

    (mockTx.apartment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in shareNumerator', async () => {
    const apartments = [createApartmentEntry({ shareNumerator: 5 })];

    const existingApartment = {
      id: 'apt-1',
      externalOwnerId: 'W001',
      externalApartmentId: 'APT001',
      owner: 'Test Owner',
      email: 'test@example.com',
      address: 'Test Street 1',
      building: 'A',
      number: '1',
      postalCode: '00-001',
      city: 'Warsaw',
      shareNumerator: 1,
      shareDenominator: 100,
      isActive: true,
      homeownersAssociationId: 'hoa-1',
    };

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingApartment])
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]);

    (mockTx.apartment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes in shareDenominator', async () => {
    const apartments = [createApartmentEntry({ shareDenominator: 200 })];

    const existingApartment = {
      id: 'apt-1',
      externalOwnerId: 'W001',
      externalApartmentId: 'APT001',
      owner: 'Test Owner',
      email: 'test@example.com',
      address: 'Test Street 1',
      building: 'A',
      number: '1',
      postalCode: '00-001',
      city: 'Warsaw',
      shareNumerator: 1,
      shareDenominator: 100,
      isActive: true,
      homeownersAssociationId: 'hoa-1',
    };

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingApartment])
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]);

    (mockTx.apartment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes when isActive is false', async () => {
    const apartments = [createApartmentEntry()];

    const existingApartment = {
      id: 'apt-1',
      externalOwnerId: 'W001',
      externalApartmentId: 'APT001',
      owner: 'Test Owner',
      email: 'test@example.com',
      address: 'Test Street 1',
      building: 'A',
      number: '1',
      postalCode: '00-001',
      city: 'Warsaw',
      shareNumerator: 1,
      shareDenominator: 100,
      isActive: false,
      homeownersAssociationId: 'hoa-1',
    };

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingApartment])
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]);

    (mockTx.apartment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should detect changes when homeownersAssociationId differs', async () => {
    const apartments = [createApartmentEntry()];

    const existingApartment = {
      id: 'apt-1',
      externalOwnerId: 'W001',
      externalApartmentId: 'APT001',
      owner: 'Test Owner',
      email: 'test@example.com',
      address: 'Test Street 1',
      building: 'A',
      number: '1',
      postalCode: '00-001',
      city: 'Warsaw',
      shareNumerator: 1,
      shareDenominator: 100,
      isActive: true,
      homeownersAssociationId: 'different-hoa',
    };

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingApartment])
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]);

    (mockTx.apartment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(stats.updated).toBe(1);
  });

  it('should return correct apartment map', async () => {
    const apartments = [
      createApartmentEntry({
        externalOwnerId: 'W001',
        externalApartmentId: 'APT001',
      }),
      createApartmentEntry({
        externalOwnerId: 'W002',
        externalApartmentId: 'APT002',
      }),
    ];

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
        { id: 'apt-2', externalOwnerId: 'W002', externalApartmentId: 'APT002' },
      ]);

    (mockTx.apartment.createMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      { count: 2 }
    );

    const result = await importApartments(
      mockTx,
      hoa,
      apartments,
      stats,
      errors
    );

    expect(result.map.get('W001#APT001')).toBe('apt-1');
    expect(result.map.get('W002#APT002')).toBe('apt-2');
    expect(result.apartmentKeysInFile.has('W001#APT001')).toBe(true);
    expect(result.apartmentKeysInFile.has('W002#APT002')).toBe(true);
  });

  it('should not deactivate when no apartments in file', async () => {
    const apartments: ApartmentEntry[] = [];

    const existingApartment = {
      id: 'apt-1',
      externalOwnerId: 'W001',
      externalApartmentId: 'APT001',
      owner: 'Test Owner',
      email: 'test@example.com',
      address: 'Test Street 1',
      building: 'A',
      number: '1',
      postalCode: '00-001',
      city: 'Warsaw',
      shareNumerator: 1,
      shareDenominator: 100,
      isActive: true,
      homeownersAssociationId: 'hoa-1',
    };

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([existingApartment])
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]);

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(stats.deleted).toBe(0);
    expect(mockTx.apartment.updateMany).not.toHaveBeenCalled();
  });

  it('should handle null email in entry', async () => {
    const apartments = [createApartmentEntry({ email: undefined })];

    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'apt-1', externalOwnerId: 'W001', externalApartmentId: 'APT001' },
      ]);

    (mockTx.apartment.createMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      { count: 1 }
    );

    await importApartments(mockTx, hoa, apartments, stats, errors);

    expect(mockTx.apartment.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ email: null })],
      skipDuplicates: true,
    });
  });
});
