import React from 'react';

import { TemplateButton } from '../../../types/components';
import { DropdownMenu } from '../DropdownMenu';

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
  symbolButtons?: TemplateButton[];
  onOpenSymbolMenu?: () => void;
  onInsertSymbol?: (value: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

const toolbarButtonClassName = (isDisabled: boolean): string =>
  `flex h-7 w-7 flex-shrink-0 items-center justify-center rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
    isDisabled
      ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
      : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600'
  }`;

const ToolbarDivider: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <div
    aria-hidden='true'
    data-testid='toolbar-divider'
    className={`h-5 w-px flex-shrink-0 bg-gray-300 dark:bg-gray-600 ${className}`}
  />
);

const UndoIcon: React.FC = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
    className='h-4 w-4'
  >
    <path d='M9 14 4 9l5-5' />
    <path d='M4 9h10.5a5.5 5.5 0 0 1 0 11H11' />
  </svg>
);

const RedoIcon: React.FC = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
    className='h-4 w-4'
  >
    <path d='m15 14 5-5-5-5' />
    <path d='M20 9H9.5a5.5 5.5 0 0 0 0 11H13' />
  </svg>
);

const SymbolsIcon: React.FC = () => (
  <span className='text-sm leading-none'>&Omega;</span>
);

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
  symbolButtons = [],
  onOpenSymbolMenu,
  onInsertSymbol,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  const formatButtonsDisabled = disabled || isPreview;

  const historyButtons = [
    {
      label: 'Undo',
      icon: <UndoIcon />,
      isDisabled: formatButtonsDisabled || !canUndo,
      onClick: onUndo,
    },
    {
      label: 'Redo',
      icon: <RedoIcon />,
      isDisabled: formatButtonsDisabled || !canRedo,
      onClick: onRedo,
    },
  ];

  return (
    <div className='flex items-center justify-between gap-2 border-b border-white/40 px-2 py-1 dark:border-white/10'>
      <div className='flex min-w-0 items-center gap-0.5'>
        <div className='flex min-w-0 gap-0.5 overflow-x-auto'>
          {historyButtons.map(({ label, icon, isDisabled, onClick }) => (
            <button
              key={label}
              type='button'
              disabled={isDisabled}
              onClick={onClick}
              title={label}
              aria-label={label}
              className={toolbarButtonClassName(isDisabled)}
            >
              {icon}
            </button>
          ))}
          <ToolbarDivider className='self-center' />
          {FORMAT_BUTTONS.map(({ action, label, icon }) => (
            <button
              key={action}
              type='button'
              disabled={formatButtonsDisabled}
              onClick={() => onFormat(action)}
              title={label}
              aria-label={label}
              className={toolbarButtonClassName(formatButtonsDisabled)}
            >
              {icon}
            </button>
          ))}
        </div>

        {symbolButtons.length > 0 && (
          <>
            <ToolbarDivider />
            <DropdownMenu
              className='flex-shrink-0'
              disabled={formatButtonsDisabled}
              menuWidthClassName='w-24'
              trigger={
                <button
                  type='button'
                  disabled={formatButtonsDisabled}
                  onClick={onOpenSymbolMenu}
                  title='Symbols'
                  aria-label='Symbols'
                  className={toolbarButtonClassName(formatButtonsDisabled)}
                >
                  <SymbolsIcon />
                </button>
              }
              items={symbolButtons.map((button, index) => ({
                id: `${button.label}-${index}`,
                label: button.label,
                onClick: () => onInsertSymbol?.(button.value),
              }))}
            />
          </>
        )}
      </div>

      <div className='glass-panel flex flex-shrink-0 overflow-hidden rounded text-xs'>
        <button
          type='button'
          onClick={() => onTogglePreview(false)}
          className={`px-3 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
            !isPreview
              ? 'glass-button-primary'
              : 'glass-interactive text-gray-600 dark:text-gray-300'
          }`}
        >
          Edit
        </button>
        <button
          type='button'
          onClick={() => onTogglePreview(true)}
          className={`segmented-divider px-3 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
            isPreview
              ? 'glass-button-primary'
              : 'glass-interactive text-gray-600 dark:text-gray-300'
          }`}
        >
          Preview
        </button>
      </div>
    </div>
  );
};
