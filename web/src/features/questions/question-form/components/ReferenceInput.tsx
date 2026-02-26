import React from 'react';

interface ReferenceInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const ReferenceInput: React.FC<ReferenceInputProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div>
      <label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Reference
      </label>
      <input
        type="text"
        id="reference"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
        placeholder="Enter source or reference (optional)..."
        disabled={disabled}
      />
    </div>
  );
};