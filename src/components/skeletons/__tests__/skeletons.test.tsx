import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdminPageSkeleton } from '@/components/skeletons/admin-page-skeleton';
import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { FormCardSkeleton } from '@/components/skeletons/form-card-skeleton';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

function hiddenBlocks(container: HTMLElement) {
  return container.querySelectorAll('[aria-hidden="true"]');
}

describe('skeletons', () => {
  it('renders the requested number of cards and rows', () => {
    render(<CardListSkeleton cards={3} rows={2} />);

    const list = screen.getByTestId('card-list-skeleton');

    expect(list.children).toHaveLength(3);
    expect(list.querySelectorAll('.rounded-lg.border')).toHaveLength(6);
  });

  it('hides every skeleton block from assistive technology', () => {
    const { container } = render(
      <>
        <PageHeaderSkeleton />
        <FormCardSkeleton />
        <AdminPageSkeleton />
      </>
    );

    const pulsing = container.querySelectorAll('[class*="animate-pulse"]');

    expect(pulsing.length).toBeGreaterThan(0);
    expect(hiddenBlocks(container).length).toBe(pulsing.length);
  });

  it('only pulses when motion is allowed', () => {
    const { container } = render(<Skeleton />);

    expect(container.firstChild).toHaveClass(
      'motion-safe:animate-pulse',
      'motion-reduce:animate-none'
    );
  });

  it('omits the description line when asked', () => {
    const { container: full } = render(<PageHeaderSkeleton />);
    const { container: short } = render(
      <PageHeaderSkeleton description={false} />
    );

    expect(full.querySelectorAll('[aria-hidden]').length).toBe(
      short.querySelectorAll('[aria-hidden]').length + 1
    );
  });
});
