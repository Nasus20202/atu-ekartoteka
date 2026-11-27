import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CHOICE_STYLES } from '@/components/votings/choice-styles';
import { RecordedAnswer } from '@/components/votings/recorded-answer';
import { VOTE_CHOICES } from '@/lib/voting/rules/voting-status';

describe('RecordedAnswer', () => {
  it('gives every answer its own icon and colour', () => {
    const styles = VOTE_CHOICES.map((choice) => CHOICE_STYLES[choice]);

    expect(new Set(styles.map(({ icon }) => icon)).size).toBe(3);
    expect(new Set(styles.map(({ tone }) => tone)).size).toBe(3);
  });

  it.each([
    ['FOR', 'Za', 'lucide-circle-check'],
    ['AGAINST', 'Przeciw', 'lucide-circle-x'],
    ['ABSTAIN', 'Wstrzymał(a) się', 'lucide-circle-minus'],
  ] as const)('marks %s', (choice, label, icon) => {
    render(<RecordedAnswer question="1. Czy?" choice={choice} />);

    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent(`1. Czy?${label}`);
    expect(item.querySelector('svg')).toHaveClass(icon);
  });

  it('has no icon without an answer', () => {
    render(<RecordedAnswer question="1. Czy?" choice={undefined} />);

    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent('—');
    expect(item.querySelector('svg')).toBeNull();
  });
});
