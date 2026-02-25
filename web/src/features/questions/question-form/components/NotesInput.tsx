import React from 'react';

interface NotesInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const NotesInput: React.FC<NotesInputProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div>
      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Explanation / Notes
      </label>
      <textarea
        id="notes"
        value={value ? value.replace(/\\n/g, '\n') : ''}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 resize-none"
        placeholder="Enter explanation or additional notes (supports Markdown)..."
        disabled={disabled}
      />
    </div>
  );
};