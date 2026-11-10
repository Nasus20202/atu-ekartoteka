import type { ReactNode } from 'react';

import {
  type Block,
  type HeadingLevel,
  type InlineNode,
  parseMarkdown,
} from '@/lib/privacy/markdown';
import { PLACEHOLDER_PATTERN } from '@/lib/privacy/placeholders';
import { cn } from '@/lib/utils';

interface PolicyTextProps {
  text: string;
  /** Marks `[[…]]` fields so an editor sees what is still to fill in. */
  highlightPlaceholders?: boolean;
  className?: string;
}

const HEADING_CLASSES: Record<HeadingLevel, string> = {
  1: 'text-2xl font-semibold tracking-tight',
  2: 'mt-8 text-lg font-semibold tracking-tight first:mt-0',
  3: 'mt-6 font-semibold first:mt-0',
};
const LINK_CLASSES =
  'rounded-sm text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const PLACEHOLDER_SPLIT = new RegExp(`(${PLACEHOLDER_PATTERN.source})`);

function renderText(text: string, highlight: boolean): ReactNode {
  if (!highlight) return text;

  return text.split(PLACEHOLDER_SPLIT).map((part, index) =>
    PLACEHOLDER_PATTERN.test(part) ? (
      <mark
        key={index}
        className="rounded-sm bg-yellow-200 px-0.5 text-yellow-950 dark:bg-yellow-900 dark:text-yellow-100"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function renderInline(nodes: InlineNode[], highlight: boolean): ReactNode {
  return nodes.map((node, index) => {
    switch (node.kind) {
      case 'bold':
        return <strong key={index}>{renderText(node.text, highlight)}</strong>;
      case 'link':
        return (
          <a
            key={index}
            href={node.href}
            className={LINK_CLASSES}
            {...(node.external && {
              target: '_blank',
              rel: 'noopener noreferrer',
            })}
          >
            {renderText(node.text, highlight)}
          </a>
        );
      default:
        return <span key={index}>{renderText(node.text, highlight)}</span>;
    }
  });
}

function BlockView({ block, highlight }: { block: Block; highlight: boolean }) {
  switch (block.kind) {
    case 'heading': {
      const Tag = `h${block.level}` as const;
      return (
        <Tag className={HEADING_CLASSES[block.level]}>
          {renderInline(block.content, highlight)}
        </Tag>
      );
    }
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag
          className={cn(
            'space-y-1.5 pl-6',
            block.ordered ? 'list-decimal' : 'list-disc'
          )}
        >
          {block.items.map((item, index) => (
            <li key={index}>{renderInline(item, highlight)}</li>
          ))}
        </Tag>
      );
    }
    default:
      return <p>{renderInline(block.content, highlight)}</p>;
  }
}

/** Renders policy Markdown as React elements; raw HTML is shown as text. */
export function PolicyText({
  text,
  highlightPlaceholders = false,
  className,
}: PolicyTextProps) {
  return (
    <div className={cn('space-y-4 text-sm leading-7 sm:text-base', className)}>
      {parseMarkdown(text).map((block, index) => (
        <BlockView
          key={index}
          block={block}
          highlight={highlightPlaceholders}
        />
      ))}
    </div>
  );
}
