import React, { useMemo } from 'react';

import { isAppleMobileDevice } from '../../utils/platform';

const SILENT_MODE_HINT = 'No sound? Check silent mode.';

/**
 * Small caption reminding iPhone/iPad users that silent mode mutes browser
 * speech. Its width is decoupled from the text so it never widens the
 * button row it sits under. Renders nothing on other devices.
 */
export const SilentModeHint: React.FC = () => {
  const isApple = useMemo(() => isAppleMobileDevice(), []);

  if (!isApple) {
    return null;
  }

  return (
    <div className='flex w-0 min-w-full justify-center'>
      <p className='whitespace-nowrap text-[8px] text-gray-500 dark:text-gray-400'>
        {SILENT_MODE_HINT}
      </p>
    </div>
  );
};
