import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HoaApartmentsContent } from '@/components/apartments/hoa-apartments-content';
import type { HoaApartmentsInitialData } from '@/components/apartments/use-hoa-apartments';
import {
  LIST_VIEW_STORAGE_KEYS,
  ListViewMode,
} from '@/hooks/use-list-view-mode';
import type { ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';

const mocks = vi.hoisted(() => ({
  useHoaApartments: vi.fn(),
  updateURL: vi.fn(),
  loadMore: vi.fn(),
  setSort: vi.fn(),
}));

vi.mock('@/components/apartments/use-hoa-apartments', () => ({
  useHoaApartments: mocks.useHoaApartments,
}));
vi.mock('@/components/layout/page-header', () => ({
  PageHeader: ({
    title,
    description,
    action,
  }: {
    title: string;
    description?: string;
    action: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {action}
    </div>
  ),
}));
vi.mock('@/components/apartments/hoa-notice-card', () => ({
  HoaNoticeCard: () => <div>notice</div>,
}));
vi.mock('@/components/apartments/apartment-list-skeleton', () => ({
  ApartmentListSkeleton: ({ mode }: { mode: string }) => (
    <div>skeleton-{mode}</div>
  ),
}));
vi.mock('@/components/apartments/apartment-table', () => ({
  ApartmentTable: ({ apartments }: { apartments: unknown[] }) => (
    <div>table-{apartments.length}</div>
  ),
}));
vi.mock('@/components/apartments/admin-apartment-card', () => ({
  AdminApartmentCard: ({
    apartment,
    isDuplicate,
  }: {
    apartment: { id: string };
    isDuplicate: boolean;
  }) => (
    <div>
      card-{apartment.id}
      {isDuplicate && ' duplicate'}
    </div>
  ),
}));
vi.mock('@/components/ui/infinite-scroll-sentinel', () => ({
  InfiniteScrollSentinel: ({ hasMore }: { hasMore: boolean }) => (
    <div>{hasMore ? 'more' : 'end'}</div>
  ),
}));

const apartment = (
  id: string,
  overrides: Partial<ApartmentSummaryDto> = {}
): ApartmentSummaryDto =>
  ({
    id,
    isActive: true,
    address: 'Długa',
    building: '1',
    number: '2',
    city: 'Gdańsk',
    postalCode: '80-001',
    ...overrides,
  }) as ApartmentSummaryDto;

const initial: HoaApartmentsInitialData = {
  hoa: null,
  page: { items: [], page: 1, totalPages: 1, total: 0 },
};

function mockHook(overrides: Record<string, unknown> = {}) {
  mocks.useHoaApartments.mockReturnValue({
    apartments: [apartment('a1'), apartment('a2', { number: '3' })],
    hoa: { name: 'Wspólnota A', externalId: 'W001', header: '', footer: '' },
    total: 2,
    loading: false,
    loadingMore: false,
    hasMore: true,
    error: null,
    loadMore: mocks.loadMore,
    search: '',
    activeOnly: false,
    updateURL: mocks.updateURL,
    sort: null,
    setSort: mocks.setSort,
    ...overrides,
  });
}

function renderContent(mode = ListViewMode.CARDS) {
  window.localStorage.setItem(LIST_VIEW_STORAGE_KEYS.apartments, mode);
  return render(
    <HoaApartmentsContent
      hoaId="hoa-1"
      initial={initial}
      initialViewMode={mode}
    />
  );
}

describe('HoaApartmentsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockHook();
  });

  it('renders the HOA header, notices and apartment cards', () => {
    renderContent();

    expect(screen.getByText('Wspólnota A')).toBeInTheDocument();
    expect(screen.getByText('W001')).toBeInTheDocument();
    expect(screen.getByText('notice')).toBeInTheDocument();
    expect(screen.getByText('card-a1')).toBeInTheDocument();
    expect(screen.getByText('card-a2')).toBeInTheDocument();
    expect(screen.getByText(/Znaleziono 2/)).toBeInTheDocument();
    expect(screen.getByText('more')).toBeInTheDocument();
  });

  it('uses a generic title until the HOA is known', () => {
    mockHook({ hoa: null, total: null });
    renderContent();

    expect(screen.getByText('Wspólnota')).toBeInTheDocument();
    expect(screen.queryByText('notice')).not.toBeInTheDocument();
    expect(screen.getByText(/Znaleziono 0/)).toBeInTheDocument();
  });

  it('renders the table in table mode', () => {
    renderContent(ListViewMode.TABLE);

    expect(screen.getByText('table-2')).toBeInTheDocument();
    expect(screen.queryByText('card-a1')).not.toBeInTheDocument();
  });

  it('shows a skeleton and hides the count while loading', () => {
    mockHook({ loading: true });
    renderContent();

    expect(screen.getByText('skeleton-cards')).toBeInTheDocument();
    expect(screen.queryByText(/Znaleziono/)).not.toBeInTheDocument();
  });

  it('shows an empty message when nothing matches', () => {
    mockHook({ apartments: [], total: 0 });
    renderContent();

    expect(screen.getByText('Nie znaleziono mieszkań')).toBeInTheDocument();
  });

  it('flags active apartments that share an address', () => {
    mockHook({
      apartments: [
        apartment('a1'),
        apartment('a2'),
        apartment('a3', { isActive: false }),
      ],
    });
    renderContent();

    expect(screen.getByText('card-a1 duplicate')).toBeInTheDocument();
    expect(screen.getByText('card-a2 duplicate')).toBeInTheDocument();
    expect(screen.getByText('card-a3')).toBeInTheDocument();
  });

  it('writes the active-only toggle to the URL', async () => {
    const user = userEvent.setup();
    renderContent();

    await user.click(screen.getByRole('checkbox', { name: /tylko aktywne/i }));

    expect(mocks.updateURL).toHaveBeenCalledWith({ activeOnly: 'true' });
  });

  it('writes the search to the URL', async () => {
    const user = userEvent.setup();
    renderContent();

    await user.type(screen.getByPlaceholderText('Wyszukaj...'), 'Długa{Enter}');

    expect(mocks.updateURL).toHaveBeenCalledWith({ search: 'Długa' });
  });
});
