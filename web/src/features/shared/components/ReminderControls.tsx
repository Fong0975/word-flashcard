import React from 'react';

export interface ReminderControlsProps {
  enabled: boolean;
  text: string;
  onEnabledChange: (enabled: boolean) => void;
  onTextChange: (text: string) => void;
  disabled?: boolean;
}

/**
 * The checkbox that turns a reminder note on, and the input that holds it.
 */
export const ReminderControls: React.FC<ReminderControlsProps> = ({
  enabled,
  text,
  onEnabledChange,
  onTextChange,
  disabled = false,
}) => (
  <div className='space-y-2'>
    <label className='flex cursor-pointer items-center gap-2'>
      <input
        type='checkbox'
        checked={enabled}
        onChange={e => onEnabledChange(e.target.checked)}
        disabled={disabled}
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
      disabled={!enabled || disabled}
      placeholder='Enter reminder note...'
      maxLength={100}
      className='glass-input w-full px-3 py-1.5'
    />
  </div>
);
