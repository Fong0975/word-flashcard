import React from 'react';

export interface SegmentedToggleOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface SegmentedToggleProps<T extends string> {
  /** Segments in display order, left to right. */
  options: readonly SegmentedToggleOption<T>[];
  /** Value of the currently selected segment. */
  value: T;
  onChange: (value: T) => void;
  /** Classes for the centering wrapper, e.g. the bottom margin. */
  className?: string;
}

const getSegmentShapeClass = (index: number, count: number): string => {
  const classes: string[] = [];
  if (index === 0) {
    classes.push('rounded-l-md');
  } else {
    classes.push('segmented-divider');
  }
  if (index === count - 1) {
    classes.push('rounded-r-md');
  }
  return classes.join(' ');
};

/**
 * Centered glass segmented control for switching between a few views of the
 * same content (e.g. the charts of a statistics modal).
 */
export const SegmentedToggle = <T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedToggleProps<T>): React.ReactElement => (
  <div className={`flex justify-center ${className}`.trim()}>
    <div className='glass-panel flex overflow-hidden rounded-md text-sm'>
      {options.map((option, index) => (
        <button
          key={option.value}
          type='button'
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={`${getSegmentShapeClass(index, options.length)} px-4 py-1.5 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 ${
            option.value === value
              ? 'glass-button-primary'
              : 'glass-interactive text-gray-600 dark:text-gray-300'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);
