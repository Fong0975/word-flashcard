import { useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MarkdownEditorField } from './MarkdownEditorField';
import { measureCaretBounds } from './textareaCaret';

vi.mock('./textareaCaret', async importOriginal => ({
  ...(await importOriginal<typeof import('./textareaCaret')>()),
  measureCaretBounds: vi.fn(),
}));

const SCROLL_TOP_BEFORE_EDIT = 100;
const VIEWPORT_HEIGHT = 200;
/** Where a browser leaves the scroll position after the value is rewritten. */
const SCROLL_TOP_AFTER_REWRITE = 999;

/**
 * Controlled editor whose textarea emulates a scrolled browser textarea:
 * jsdom does no layout, so the scroll metrics are stubbed, and every value
 * change jumps to the bottom the way a real rewrite of the value does.
 */
const ScrolledEditorHarness = () => {
  const [value, setValue] = useState('abc');
  return (
    <MarkdownEditorField
      value={value}
      onChange={next => {
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        textarea.scrollTop = SCROLL_TOP_AFTER_REWRITE;
        setValue(next);
      }}
      templateButtons={[{ label: 'Divider', value: '---' }]}
    />
  );
};

describe('MarkdownEditorField scroll position', () => {
  // restoreAllMocks only restores vi.spyOn spies; the vi.fn() created by
  // vi.mock keeps its calls across cases unless it is reset explicitly.
  beforeEach(() => {
    vi.mocked(measureCaretBounds).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    {
      name: 'keeps the scroll position after a format button when the caret stays visible',
      button: 'Bold',
      caret: { top: 150, height: 20 },
      expected: { scrollTop: SCROLL_TOP_BEFORE_EDIT, caretPosition: 3 },
    },
    {
      name: 'keeps the scroll position after a template when the caret stays visible',
      button: 'Divider',
      caret: { top: 150, height: 20 },
      expected: { scrollTop: SCROLL_TOP_BEFORE_EDIT, caretPosition: 4 },
    },
    {
      name: 'scrolls up just enough to reveal a caret above the viewport',
      button: 'Bold',
      caret: { top: 40, height: 20 },
      expected: { scrollTop: 40, caretPosition: 3 },
    },
    {
      name: 'scrolls down just enough to reveal a caret below the viewport',
      button: 'Bold',
      caret: { top: 400, height: 20 },
      expected: { scrollTop: 220, caretPosition: 3 },
    },
  ])('$name', async ({ button, caret, expected }) => {
    vi.mocked(measureCaretBounds).mockReturnValue(caret);
    const user = userEvent.setup();
    render(<ScrolledEditorHarness />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    Object.defineProperty(textarea, 'scrollTop', {
      value: SCROLL_TOP_BEFORE_EDIT,
      writable: true,
    });
    Object.defineProperty(textarea, 'clientHeight', {
      value: VIEWPORT_HEIGHT,
    });
    act(() => textarea.focus());
    textarea.setSelectionRange(1, 1);

    await user.click(screen.getByRole('button', { name: button }));

    // The selection and scroll position are restored in a later animation
    // frame; the measurement is the last step before the scroll is applied.
    await waitFor(() => expect(measureCaretBounds).toHaveBeenCalledOnce());
    expect(measureCaretBounds).toHaveBeenCalledWith(
      textarea,
      expected.caretPosition,
    );
    expect(textarea).toHaveFocus();
    expect(textarea.scrollTop).toBe(expected.scrollTop);
  });
});
