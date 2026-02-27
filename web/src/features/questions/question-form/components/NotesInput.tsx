import React from 'react';

interface NotesInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const NotesInput: React.FC<NotesInputProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div>
      <label
        htmlFor='notes'
        className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
      >
        Explanation / Notes
      </label>
      <textarea
        id='notes'
        value={value ? value.replace(/\\n/g, '\n') : ''}
        onChange={e => onChange(e.target.value)}
        rows={4}
        className='w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800'
        placeholder='Enter explanation or additional notes (supports Markdown)...'
        disabled={disabled}
      />
    </div>
  );
};
