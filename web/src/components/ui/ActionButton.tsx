import React from 'react';
import { DropdownMenu, DropdownMenuItem } from './DropdownMenu';

interface ActionButtonProps {
  label: string;
  icon?: React.ReactNode;
  items: DropdownMenuItem[];
  disabled?: boolean;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon,
  items,
  disabled = false,
  className = '',
}) => {
  const buttonClass = `
    inline-flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-md
    border border-gray-300 dark:border-gray-600 shadow-sm
    transition-colors duration-200
    ${
      disabled
        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
    }
    ${className}
  `;

  const triggerButton = (
    <button
      type="button"
      className={buttonClass}
      disabled={disabled}
    >
      <div className="flex items-center space-x-2">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
        {/* Dropdown chevron */}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>
  );

  return (
    <DropdownMenu
      trigger={triggerButton}
      items={items}
      disabled={disabled}
    />
  );
};