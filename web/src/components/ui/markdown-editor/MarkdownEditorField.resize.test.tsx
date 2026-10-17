import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MarkdownEditorField } from './MarkdownEditorField';
import { RESIZE_KEYBOARD_STEP_PX } from './useVerticalResize';

/** Stands in for the h-78 box's rendered height, since jsdom does no layout. */
const FIXED_BOX_HEIGHT = 312;

describe('MarkdownEditorField resize handle', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(
      FIXED_BOX_HEIGHT,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const tests = [
    {
      name: 'fixed mode offers a handle whose height survives toggling Preview',
      heightMode: 'fixed' as const,
      expectHandle: true,
    },
    {
      name: 'flex mode has no handle',
      heightMode: 'flex' as const,
      expectHandle: false,
    },
  ];

  it.each(tests)('$name', async ({ heightMode, expectHandle }) => {
    const user = userEvent.setup();
    render(
      <MarkdownEditorField
        value='text'
        onChange={vi.fn()}
        heightMode={heightMode}
      />,
    );

    const handle = screen.queryByRole('separator', { name: 'Resize editor' });
    if (!expectHandle) {
      expect(handle).not.toBeInTheDocument();
      return;
    }

    expect(handle).toBeInTheDocument();
    const editorBox = screen.getByRole('textbox').parentElement as HTMLElement;
    const expectedHeight = `${FIXED_BOX_HEIGHT + RESIZE_KEYBOARD_STEP_PX}px`;

    fireEvent.keyDown(handle as HTMLElement, { key: 'ArrowDown' });
    expect(editorBox.style.height).toBe(expectedHeight);

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(editorBox.style.height).toBe(expectedHeight);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('textbox').parentElement).toBe(editorBox);
    expect(editorBox.style.height).toBe(expectedHeight);
  });
});
