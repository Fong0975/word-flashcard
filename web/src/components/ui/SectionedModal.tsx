import React from 'react';

import { Modal } from './Modal';

type SectionedModalProps = Omit<
  React.ComponentProps<typeof Modal>,
  'title' | 'className' | 'contentClassName'
> & {
  header: React.ReactNode;
  footer: React.ReactNode;
  /** Rendered inside the modal but outside its sections, e.g. toasts and dialogs. */
  overlays?: React.ReactNode;
};

/** Keeps the scrollbar at the panel edge while content stays inset. */
const SECTION_PADDING = 'px-2 md:px-3 lg:px-4';

/**
 * Viewport-height modal with a fixed header and footer around a scrollable body.
 *
 * @param header - Content pinned above the scrollable body.
 * @param footer - Content pinned below the scrollable body.
 * @param children - Scrollable body content.
 * @param overlays - Extra elements that are not part of any section.
 */
export const SectionedModal: React.FC<SectionedModalProps> = ({
  header,
  footer,
  overlays,
  children,
  ...modalProps
}) => (
  // `overflow-clip` rather than `overflow-hidden`: a hidden box can still be
  // scrolled by the browser to reveal the caret or focus, and the user has no
  // way to scroll it back.
  <Modal
    {...modalProps}
    className='max-h-[95vh] overflow-clip'
    contentClassName=''
  >
    <div className='flex h-[90vh] flex-col'>
      <div className={`mb-2 shrink-0 pt-4 ${SECTION_PADDING}`}>{header}</div>
      <div
        className={`min-h-0 flex-1 space-y-6 overflow-y-auto py-4 ${SECTION_PADDING}`}
      >
        {children}
      </div>
      <div className={`shrink-0 pb-2 ${SECTION_PADDING}`}>{footer}</div>
    </div>
    {overlays}
  </Modal>
);
