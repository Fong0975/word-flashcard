import React, { useRef } from 'react';

import { useVerticalResize } from './useVerticalResize';

interface ResizableEditorBoxProps {
  /** The editor body (textarea or preview); it should fill the box with `h-full`. */
  children: React.ReactNode;
}

/**
 * Fixed-height h-78 box with a drag handle below it that lets the user make
 * the box taller, never shorter than its initial height. The height is not
 * persisted, so it resets once the box unmounts.
 */
export const ResizableEditorBox: React.FC<ResizableEditorBoxProps> = ({
  children,
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const { height, handleProps } = useVerticalResize(boxRef);

  return (
    <>
      <div
        ref={boxRef}
        className='h-78'
        style={height === null ? undefined : { height }}
      >
        {children}
      </div>
      <div
        {...handleProps}
        className='focus-ring text-supporting flex h-3 shrink-0 cursor-row-resize touch-none items-center justify-center select-none focus-visible:ring-inset'
      >
        <span aria-hidden='true' className='h-1 w-8 rounded-full bg-current' />
      </div>
    </>
  );
};
