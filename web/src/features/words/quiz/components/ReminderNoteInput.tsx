import React from 'react';

interface ReminderNoteInputProps {
  enabled: boolean;
  text: string;
  onEnabledChange: (enabled: boolean) => void;
  onTextChange: (text: string) => void;
}

export const ReminderNoteInput: React.FC<ReminderNoteInputProps> = ({
  enabled,
  text,
  onEnabledChange,
  onTextChange,
}) => (
  <div className='mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50'>
    <p className='mb-3 text-sm font-medium text-gray-700 dark:text-gray-300'>
      Have a note to remember? Set a reminder before rating.
    </p>
    <label className='mb-2 flex cursor-pointer items-center gap-2'>
      <input
        type='checkbox'
        checked={enabled}
        onChange={e => {
          onEnabledChange(e.target.checked);
          if (!e.target.checked) {
            onTextChange('');
          }
        }}
        className='h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 dark:border-gray-500'
      />
      <span className='text-sm text-gray-600 dark:text-gray-400'>
        Set a reminder note
      </span>
    </label>
    <input
      type='text'
      value={text}
      onChange={e => onTextChange(e.target.value)}
      disabled={!enabled}
      placeholder='Enter reminder note...'
      maxLength={100}
      className='w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-500'
    />
  </div>
);
