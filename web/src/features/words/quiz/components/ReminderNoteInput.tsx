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
        className='glass-checkbox'
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
      className='glass-input w-full px-3 py-1.5'
    />
  </div>
);
