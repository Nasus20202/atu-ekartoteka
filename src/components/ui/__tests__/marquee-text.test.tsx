import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MarqueeText } from '@/components/ui/marquee-text';

const TEXT = 'ul. Testowa z Bardzo Długą Nazwą Ulicy 11/1';
const CONTAINER_WIDTH = 232;
const FADES_WIDTH = 32;

function mockWidths(textWidth: number) {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(
    CONTAINER_WIDTH
  );
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(
    textWidth
  );
}

describe('MarqueeText', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders static text when it fits', () => {
    mockWidths(CONTAINER_WIDTH - FADES_WIDTH);

    render(<MarqueeText>{TEXT}</MarqueeText>);

    const text = screen.getByText(TEXT);
    expect(text).not.toHaveClass('animate-marquee');
    expect(text.parentElement).not.toHaveClass('mask-fade-x');
  });

  it('scrolls by the overflowing width when text does not fit', () => {
    mockWidths(CONTAINER_WIDTH - FADES_WIDTH + 120);

    render(<MarqueeText>{TEXT}</MarqueeText>);

    const text = screen.getByText(TEXT);
    expect(text).toHaveClass('animate-marquee');
    expect(text.style.getPropertyValue('--marquee-distance')).toBe('-120px');
    expect(text.parentElement).toHaveClass('mask-fade-x');
  });
});
