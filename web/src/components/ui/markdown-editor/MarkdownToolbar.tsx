import React from 'react';

export type MarkdownFormatAction =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'quote'
  | 'code'
  | 'link'
  | 'bulletList'
  | 'numberedList';

interface MarkdownToolbarProps {
  onFormat: (action: MarkdownFormatAction) => void;
  disabled?: boolean;
  isPreview: boolean;
  onTogglePreview: (isPreview: boolean) => void;
}

const LinkIcon: React.FC = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    className='h-4 w-4'
  >
    <rect
      x='2'
      y='9'
      width='10'
      height='6'
      rx='3'
      transform='rotate(-45 7 12)'
    />
    <rect
      x='12'
      y='9'
      width='10'
      height='6'
      rx='3'
      transform='rotate(-45 17 12)'
    />
  </svg>
);

const BulletListIcon: React.FC = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    className='h-4 w-4'
  >
    <circle cx='4' cy='6' r='1' fill='currentColor' stroke='none' />
    <circle cx='4' cy='12' r='1' fill='currentColor' stroke='none' />
    <circle cx='4' cy='18' r='1' fill='currentColor' stroke='none' />
    <line x1='9' y1='6' x2='21' y2='6' />
    <line x1='9' y1='12' x2='21' y2='12' />
    <line x1='9' y1='18' x2='21' y2='18' />
  </svg>
);

const NumberedListIcon: React.FC = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    className='h-4 w-4'
  >
    <line x1='9' y1='6' x2='21' y2='6' />
    <line x1='9' y1='12' x2='21' y2='12' />
    <line x1='9' y1='18' x2='21' y2='18' />
    <text x='2' y='8' fontSize='6' stroke='none' fill='currentColor'>
      1
    </text>
    <text x='2' y='14' fontSize='6' stroke='none' fill='currentColor'>
      2
    </text>
    <text x='2' y='20' fontSize='6' stroke='none' fill='currentColor'>
      3
    </text>
  </svg>
);

const FORMAT_BUTTONS: {
  action: MarkdownFormatAction;
  label: string;
  icon: React.ReactNode;
}[] = [
  { action: 'bold', label: 'Bold', icon: <span className='font-bold'>B</span> },
  {
    action: 'italic',
    label: 'Italic',
    icon: <span className='italic'>I</span>,
  },
  {
    action: 'underline',
    label: 'Underline',
    icon: <span className='underline'>U</span>,
  },
  {
    action: 'quote',
    label: 'Quote',
    icon: <span className='text-base leading-none'>&rdquo;</span>,
  },
  {
    action: 'code',
    label: 'Code',
    icon: <span className='font-mono text-[11px]'>{'</>'}</span>,
  },
  { action: 'link', label: 'Link', icon: <LinkIcon /> },
  { action: 'bulletList', label: 'Bullet List', icon: <BulletListIcon /> },
  {
    action: 'numberedList',
    label: 'Numbered List',
    icon: <NumberedListIcon />,
  },
];

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  onFormat,
  disabled = false,
  isPreview,
  onTogglePreview,
}) => {
  const formatButtonsDisabled = disabled || isPreview;

  return (
    <div className='flex items-center gap-2 border-b border-gray-300 bg-gray-50 px-2 py-1 dark:border-gray-600 dark:bg-gray-800'>
      <div className='flex min-w-0 flex-1 gap-0.5 overflow-x-auto'>
        {FORMAT_BUTTONS.map(({ action, label, icon }) => (
          <button
            key={action}
            type='button'
            disabled={formatButtonsDisabled}
            onClick={() => onFormat(action)}
            title={label}
            aria-label={label}
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              formatButtonsDisabled
                ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>

      <div className='flex flex-shrink-0 overflow-hidden rounded text-xs'>
        <button
          type='button'
          onClick={() => onTogglePreview(false)}
          className={`px-3 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
            !isPreview
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
          }`}
        >
          Edit
        </button>
        <button
          type='button'
          onClick={() => onTogglePreview(true)}
          className={`px-3 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
            isPreview
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
          }`}
        >
          Preview
        </button>
      </div>
    </div>
  );
};
