import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your note in Markdown...',
  rows = 16,
}) => {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className='flex flex-1 flex-col'>
      <div className='mb-1 flex justify-end'>
        <div className='flex rounded-md border border-gray-300 text-xs dark:border-gray-600'>
          <button
            type='button'
            onClick={() => setIsPreview(false)}
            className={`rounded-l-md px-3 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              !isPreview
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Edit
          </button>
          <button
            type='button'
            onClick={() => setIsPreview(true)}
            className={`rounded-r-md border-l border-gray-300 px-3 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:border-gray-600 ${
              isPreview
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {isPreview ? (
        <div className='min-h-0 flex-1 overflow-y-auto rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600'>
          {value.trim() ? (
            <div className='prose prose-sm prose-slate max-w-none dark:prose-invert prose-headings:text-gray-800 prose-p:text-gray-600 prose-code:rounded-md prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-pink-500 prose-code:before:content-none prose-code:after:content-none prose-ul:text-gray-600 dark:prose-headings:text-gray-200 dark:prose-p:text-gray-400 dark:prose-code:bg-gray-800 dark:prose-code:text-pink-400 dark:prose-ul:text-gray-400'>
              <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>
                {value}
              </ReactMarkdown>
            </div>
          ) : (
            <p className='text-sm text-gray-400 dark:text-gray-500'>
              Nothing to preview.
            </p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          className='min-h-0 w-full flex-1 resize-none rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
          placeholder={placeholder}
        />
      )}
    </div>
  );
};
