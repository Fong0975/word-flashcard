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

export type MarkdownContentVariant =
  | 'plain'
  | 'boxed-yellow'
  | 'boxed-gray'
  | 'boxed-white';

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
    'prose prose-sm prose-slate max-w-none dark:prose-invert prose-headings:text-gray-800 prose-p:text-gray-600 prose-code:rounded-md prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-pink-500 prose-code:before:content-none prose-code:after:content-none prose-ul:text-gray-600 dark:prose-headings:text-gray-200 dark:prose-p:text-gray-400 dark:prose-code:bg-gray-700 dark:prose-code:text-pink-400 dark:prose-ul:text-gray-400',
  'boxed-yellow':
    'prose prose-sm prose-slate max-w-none rounded bg-yellow-50 p-2 dark:prose-invert prose-headings:text-gray-800 prose-p:text-gray-600 prose-ul:text-gray-600 dark:bg-yellow-900/20 dark:prose-headings:text-gray-200 dark:prose-p:text-gray-400 dark:prose-ul:text-gray-400',
  'boxed-gray':
    'prose prose-sm prose-slate max-w-none dark:prose-invert prose-p:text-gray-600 dark:prose-p:text-gray-400',
  'boxed-white':
    'prose prose-sm prose-slate max-w-none dark:prose-invert prose-p:text-gray-700 dark:prose-p:text-gray-300',
};

const INNER_CLASSNAMES: Partial<Record<MarkdownContentVariant, string>> = {
  'boxed-yellow':
    'prose prose-sm prose-slate max-w-none rounded dark:prose-invert prose-p:text-gray-600 prose-code:rounded-md prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-pink-500 prose-code:before:content-none prose-code:after:content-none dark:prose-p:text-gray-400 dark:prose-code:bg-gray-700 dark:prose-code:text-pink-400',
  'boxed-gray':
    'prose prose-sm prose-slate max-w-none rounded dark:prose-invert prose-p:text-gray-600 prose-code:rounded-md prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-pink-500 prose-code:before:content-none prose-code:after:content-none dark:prose-p:text-gray-400 dark:prose-code:bg-gray-800 dark:prose-code:text-pink-400',
  'boxed-white':
    'prose prose-sm prose-slate max-w-none dark:prose-invert prose-p:text-gray-700 prose-code:rounded-md prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-pink-600 prose-code:before:content-none prose-code:after:content-none dark:prose-p:text-gray-300 dark:prose-code:bg-gray-700 dark:prose-code:text-pink-400',
};

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  variant = 'plain',
  unescapeLiteralNewlines = false,
}) => {
  const text = unescapeLiteralNewlines
    ? content.replace(/\\n/g, '\n')
    : content;

  const markdown = (
    <ReactMarkdown
      remarkPlugins={[remarkBreaks, remarkGfm, remarkAlert]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
    >
      {text}
    </ReactMarkdown>
  );

  const innerClassName = INNER_CLASSNAMES[variant];

  return (
    <div className={OUTER_CLASSNAMES[variant]}>
      {innerClassName ? (
        <div className={innerClassName}>{markdown}</div>
      ) : (
        markdown
      )}
    </div>
  );
};
