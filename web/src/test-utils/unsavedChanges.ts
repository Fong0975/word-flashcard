import { act, screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/**
 * Simulates pressing the browser back button.
 *
 * Relies on setupTests.ts replacing history.back() with a synchronous
 * back press, so the resulting popstate is handled before this returns.
 */
export const pressBrowserBack = (): void => {
  act(() => {
    window.history.back();
  });
};

/** One way a user can try to leave a form modal without saving. */
export interface ModalLeaveMethod {
  via: string;
  leave: (user: UserEvent) => Promise<void>;
}

/**
 * Every route out of a form modal that must be covered by the unsaved
 * changes confirmation, for use as an `it.each` table.
 */
export const modalLeaveMethods: ModalLeaveMethod[] = [
  {
    via: 'the close button',
    leave: user =>
      user.click(screen.getByRole('button', { name: 'Close modal' })),
  },
  { via: 'Escape', leave: user => user.keyboard('{Escape}') },
  {
    via: 'the browser back button',
    leave: async () => pressBrowserBack(),
  },
];
