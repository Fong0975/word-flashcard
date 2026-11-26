import React from 'react';

import { ReminderControls, ReminderControlsProps } from './ReminderControls';

interface ReminderFormFieldProps extends ReminderControlsProps {
  /** Explains what the note is for in the surrounding form. */
  description: string;
}

/**
 * The titled reminder note field used by the edit forms.
 */
export const ReminderFormField: React.FC<ReminderFormFieldProps> = ({
  description,
  ...controlsProps
}) => (
  <div>
    <p className='mb-1 text-sm font-medium text-gray-700 dark:text-gray-300'>
      Reminder
    </p>
    <p className='mb-2 text-xs text-gray-500 dark:text-gray-400'>
      {description}
    </p>
    <div className='pl-3'>
      <ReminderControls {...controlsProps} />
    </div>
  </div>
);
