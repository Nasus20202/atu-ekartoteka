import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HoaApartmentsSection } from '@/components/apartments/hoa-apartments-section';

const mocks = vi.hoisted(() => ({
  requireAdminAccess: vi.fn(),
  loadApartmentsPage: vi.fn(),
  content: vi.fn(),
}));

vi.mock('@/lib/list-view-mode-server', () => ({
  getListViewMode: () => Promise.resolve('table'),
}));
vi.mock('@/lib/auth/require-admin-access', () => ({
  requireAdminAccess: mocks.requireAdminAccess,
}));
vi.mock('@/app/api/admin/apartments/load-apartments-page', () => ({
  loadApartmentsPage: mocks.loadApartmentsPage,
}));
vi.mock('@/components/apartments/hoa-apartments-content', () => ({
  HoaApartmentsContent: (props: unknown) => {
    mocks.content(props);
    return <div>content</div>;
  },
}));

const pagination = { page: 1, limit: 20, total: 1, totalPages: 1 };

describe('HoaApartmentsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAccess.mockResolvedValue({});
    mocks.loadApartmentsPage.mockResolvedValue({
      apartments: [{ id: 'a1' }],
      hoa: { id: 'hoa-1' },
      pagination,
    });
  });

  it('loads the first page for the URL query', async () => {
    render(
      await HoaApartmentsSection({
        params: Promise.resolve({ hoaId: 'hoa-1' }),
        searchParams: Promise.resolve({ search: ' 17 ', activeOnly: 'true' }),
      })
    );

    expect(screen.getByText('content')).toBeInTheDocument();
    expect(mocks.loadApartmentsPage).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      hoaId: 'hoa-1',
      search: '17',
      activeOnly: true,
      assignableTo: null,
      order: 'asc',
    });
    expect(mocks.content).toHaveBeenCalledWith({
      hoaId: 'hoa-1',
      initial: {
        hoa: { id: 'hoa-1' },
        page: { items: [{ id: 'a1' }], ...pagination },
      },
      initialViewMode: 'table',
    });
  });

  it('does not query when the admin check fails', async () => {
    mocks.requireAdminAccess.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(
      HoaApartmentsSection({
        params: Promise.resolve({ hoaId: 'hoa-1' }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.loadApartmentsPage).not.toHaveBeenCalled();
  });
});
