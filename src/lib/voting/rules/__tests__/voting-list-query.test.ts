import { describe, expect, it } from 'vitest';

import {
  ALL_VOTINGS,
  toVotingListQuery,
} from '@/lib/voting/rules/voting-list-query';

describe('toVotingListQuery', () => {
  it('lists everything, newest first, without parameters', () => {
    expect(toVotingListQuery({})).toEqual(ALL_VOTINGS);
  });

  it('reads the filters and the order', () => {
    expect(
      toVotingListQuery({
        hoa: 'h1',
        status: 'ARCHIVED',
        sort: 'title',
        order: 'asc',
      })
    ).toEqual({
      hoaId: 'h1',
      status: 'ARCHIVED',
      sort: { key: 'title', direction: 'asc' },
    });
  });

  it.each([
    { status: 'OPEN' },
    { sort: 'password', order: 'asc' },
    { sort: 'toString', order: 'asc' },
    { sort: 'title', order: 'up' },
    { hoa: ['h1', 'h2'] },
  ])('ignores %j', (params) => {
    expect(toVotingListQuery(params)).toEqual(ALL_VOTINGS);
  });
});
