import { render, screen } from '@testing-library/react';
import useSWR from 'swr';
import { describe, expect, it } from 'vitest';

import { SwrScope } from '@/components/providers/swr-scope';

function Value() {
  const { data } = useSWR('scoped-key', () => 'loaded', {
    fallbackData: 'fallback',
    revalidateOnMount: false,
  });
  return <p>{data}</p>;
}

function Writer() {
  const { mutate } = useSWR('scoped-key', null, { fallbackData: 'fallback' });
  return (
    <button onClick={() => void mutate('left-by-a-visit', false)}>set</button>
  );
}

describe('SwrScope', () => {
  it('does not carry cached data over to the next mount', async () => {
    const first = render(
      <SwrScope>
        <Writer />
        <Value />
      </SwrScope>
    );
    first.getByText('set').click();
    expect(await screen.findByText('left-by-a-visit')).toBeInTheDocument();
    first.unmount();

    render(
      <SwrScope>
        <Value />
      </SwrScope>
    );

    expect(screen.getByText('fallback')).toBeInTheDocument();
  });

  it('keeps the subtree sharing one cache', async () => {
    render(
      <SwrScope>
        <Writer />
        <Value />
        <Value />
      </SwrScope>
    );
    screen.getByText('set').click();

    expect(await screen.findAllByText('left-by-a-visit')).toHaveLength(2);
  });
});
