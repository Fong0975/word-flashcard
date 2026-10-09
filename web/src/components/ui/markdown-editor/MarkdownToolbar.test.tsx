import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MarkdownToolbar } from './MarkdownToolbar';

describe('MarkdownToolbar', () => {
  it('renders every format button and the Edit/Preview toggle', () => {
    render(
      <MarkdownToolbar
        onFormat={vi.fn()}
        isPreview={false}
        onTogglePreview={vi.fn()}
      />,
    );

    [
      'Undo',
      'Redo',
      'Bold',
      'Italic',
      'Underline',
      'Quote',
      'Code',
      'Link',
      'Bullet List',
      'Numbered List',
    ].forEach(label => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
  });

  it('calls onFormat with the clicked action', async () => {
    const user = userEvent.setup();
    const onFormat = vi.fn();
    render(
      <MarkdownToolbar
        onFormat={onFormat}
        isPreview={false}
        onTogglePreview={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(onFormat).toHaveBeenCalledWith('bold');

    await user.click(screen.getByRole('button', { name: 'Bullet List' }));
    expect(onFormat).toHaveBeenCalledWith('bulletList');
  });

  it('disables format buttons while disabled or in preview mode', () => {
    render(
      <MarkdownToolbar
        onFormat={vi.fn()}
        disabled
        isPreview={false}
        onTogglePreview={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled();
  });

  it('disables format buttons in preview mode even when not otherwise disabled', () => {
    render(
      <MarkdownToolbar
        onFormat={vi.fn()}
        isPreview
        onTogglePreview={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled();
  });

  it.each([
    {
      name: 'both disabled by default',
      props: {},
      undoDisabled: true,
      redoDisabled: true,
    },
    {
      name: 'only Undo enabled when there is nothing to redo',
      props: { canUndo: true },
      undoDisabled: false,
      redoDisabled: true,
    },
    {
      name: 'only Redo enabled when there is nothing to undo',
      props: { canRedo: true },
      undoDisabled: true,
      redoDisabled: false,
    },
    {
      name: 'both enabled when both directions are available',
      props: { canUndo: true, canRedo: true },
      undoDisabled: false,
      redoDisabled: false,
    },
    {
      name: 'both disabled while the editor is disabled',
      props: { canUndo: true, canRedo: true, disabled: true },
      undoDisabled: true,
      redoDisabled: true,
    },
    {
      name: 'both disabled in preview mode',
      props: { canUndo: true, canRedo: true, isPreview: true },
      undoDisabled: true,
      redoDisabled: true,
    },
  ])(
    'renders Undo/Redo with $name',
    ({ props, undoDisabled, redoDisabled }) => {
      render(
        <MarkdownToolbar
          onFormat={vi.fn()}
          isPreview={false}
          onTogglePreview={vi.fn()}
          {...props}
        />,
      );

      const undo = screen.getByRole('button', { name: 'Undo' });
      const redo = screen.getByRole('button', { name: 'Redo' });
      expect(undo.hasAttribute('disabled')).toBe(undoDisabled);
      expect(redo.hasAttribute('disabled')).toBe(redoDisabled);
    },
  );

  it('calls onUndo and onRedo when their buttons are clicked', async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    render(
      <MarkdownToolbar
        onFormat={vi.fn()}
        isPreview={false}
        onTogglePreview={vi.fn()}
        canUndo
        canRedo
        onUndo={onUndo}
        onRedo={onRedo}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Redo' }));
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('places Undo and Redo before Bold, separated from it by a divider', () => {
    render(
      <MarkdownToolbar
        onFormat={vi.fn()}
        isPreview={false}
        onTogglePreview={vi.fn()}
      />,
    );

    const undo = screen.getByRole('button', { name: 'Undo' });
    const redo = screen.getByRole('button', { name: 'Redo' });
    const bold = screen.getByRole('button', { name: 'Bold' });
    const divider = screen.getByTestId('toolbar-divider');

    expect(undo.nextElementSibling).toBe(redo);
    expect(redo.nextElementSibling).toBe(divider);
    expect(divider.nextElementSibling).toBe(bold);
  });

  it('does not render the Symbols button when symbolButtons is empty', () => {
    render(
      <MarkdownToolbar
        onFormat={vi.fn()}
        isPreview={false}
        onTogglePreview={vi.fn()}
        symbolButtons={[]}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Symbols' }),
    ).not.toBeInTheDocument();
  });

  it('opens the symbols menu and inserts the clicked symbol', async () => {
    const user = userEvent.setup();
    const onOpenSymbolMenu = vi.fn();
    const onInsertSymbol = vi.fn();
    render(
      <MarkdownToolbar
        onFormat={vi.fn()}
        isPreview={false}
        onTogglePreview={vi.fn()}
        symbolButtons={[
          { label: '→', value: '→' },
          { label: '•', value: '•' },
        ]}
        onOpenSymbolMenu={onOpenSymbolMenu}
        onInsertSymbol={onInsertSymbol}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Symbols' }));
    expect(onOpenSymbolMenu).toHaveBeenCalled();

    await user.click(screen.getByRole('menuitem', { name: '•' }));
    expect(onInsertSymbol).toHaveBeenCalledWith('•');
  });

  it('does not disable the Edit/Preview toggle itself', () => {
    render(
      <MarkdownToolbar
        onFormat={vi.fn()}
        disabled
        isPreview
        onTogglePreview={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Edit' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Preview' })).not.toBeDisabled();
  });

  it('toggles preview mode when Edit/Preview is clicked', async () => {
    const user = userEvent.setup();
    const onTogglePreview = vi.fn();
    render(
      <MarkdownToolbar
        onFormat={vi.fn()}
        isPreview={false}
        onTogglePreview={onTogglePreview}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(onTogglePreview).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onTogglePreview).toHaveBeenCalledWith(false);
  });
});
