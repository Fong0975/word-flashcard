import React from 'react';

import { ReminderControls, ReminderControlsProps } from './ReminderControls';

interface ReminderNoteInputProps extends ReminderControlsProps {
  /** Tells the user when the note should be set. */
  description: string;
}

/**
 * The panel a quiz offers for attaching a reminder note while an answer is
 * under review.
 */
export const ReminderNoteInput: React.FC<ReminderNoteInputProps> = ({
  description,
  ...controlsProps
}) => (
  <div className='glass-panel mb-4 rounded-lg p-4'>
    <p className='mb-3 text-sm font-medium text-gray-700 dark:text-gray-300'>
      {description}
    </p>
    <ReminderControls {...controlsProps} />
  </div>
);
