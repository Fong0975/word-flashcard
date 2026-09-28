import React from 'react';
import ReactMarkdown from 'react-markdown';
import { remarkAlert } from 'remark-github-blockquote-alert';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

/**
 * `remark-github-blockquote-alert` renders its NOTE/TIP/IMPORTANT/WARNING/CAUTION
 * boxes as `className`-tagged divs/paragraphs plus an inline octicon `<svg>`. None
 * of those are in rehype-sanitize's default (very conservative) schema, so it has
 * to be extended or the alert styling/icon gets silently stripped.
 */
const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'svg', 'path'],
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div ?? []), 'className'],
    p: [...(defaultSchema.attributes?.p ?? []), 'className'],
    svg: ['className', 'viewBox', 'width', 'height', 'ariaHidden'],
    path: ['d'],
  },
};

export type MarkdownContentVariant = 'plain' | 'notes';

interface MarkdownContentProps {
  content: string;
  variant?: MarkdownContentVariant;
  /**
   * Word/question `notes` fields are persisted with literal `\n` sequences
   * instead of real line breaks, so they must be unescaped before rendering.
   */
  unescapeLiteralNewlines?: boolean;
}

const OUTER_CLASSNAMES: Record<MarkdownContentVariant, string> = {
  plain:
    'prose prose-sm prose-slate max-w-none dark:prose-invert prose-headings:text-gray-800 prose-p:text-gray-600 prose-code:rounded-md prose-code:bg-gray-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-pink-600 prose-code:before:content-none prose-code:after:content-none prose-ul:text-gray-600 prose-hr:border-gray-400 dark:prose-headings:text-gray-200 dark:prose-p:text-gray-400 dark:prose-code:bg-gray-600 dark:prose-code:text-pink-400 dark:prose-ul:text-gray-400 dark:prose-hr:border-gray-500',
  /*
   * Same as `plain`, but also dims `<strong>`/headings (which the Typography
   * plugin otherwise renders at full black/white regardless of `prose-p`)
   * so they stay visually a step below a solid-black/white section heading
   * placed above it (e.g. the "Notes"/"Explanation" heading above it).
   */
  notes:
    'prose prose-sm prose-slate max-w-none dark:prose-invert prose-headings:text-gray-700 prose-p:text-gray-600 prose-strong:text-gray-700 prose-code:rounded-md prose-code:bg-gray-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-pink-600 prose-code:before:content-none prose-code:after:content-none prose-ul:text-gray-600 prose-hr:border-gray-400 dark:prose-headings:text-gray-300 dark:prose-p:text-gray-400 dark:prose-strong:text-gray-300 dark:prose-code:bg-gray-600 dark:prose-code:text-pink-400 dark:prose-ul:text-gray-400 dark:prose-hr:border-gray-500',
};

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  variant = 'plain',
  unescapeLiteralNewlines = false,
}) => {
  const text = unescapeLiteralNewlines
    ? content.replace(/\\n/g, '\n')
    : content;

  return (
    <div className={OUTER_CLASSNAMES[variant]}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks, remarkGfm, remarkAlert]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};
