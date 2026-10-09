import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MarkdownEditorField } from './MarkdownEditorField';

type User = ReturnType<typeof userEvent.setup>;

const HistoryHarness = () => {
  const [value, setValue] = useState('');
  return (
    <>
      <MarkdownEditorField
        value={value}
        onChange={setValue}
        templateButtons={[{ label: 'Divider', value: '---' }]}
        onAppendTemplate={text => setValue(prev => prev + text)}
      />
      <button type='button' onClick={() => setValue('loaded')}>
        Load
      </button>
    </>
  );
};

const undoButton = () => screen.getByRole('button', { name: 'Undo' });
const redoButton = () => screen.getByRole('button', { name: 'Redo' });
const clickButton = (user: User, name: string) =>
  user.click(screen.getByRole('button', { name }));

describe('MarkdownEditorField undo / redo', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(
      async () =>
        new Response(JSON.stringify([{ label: '→', value: '→' }]), {
          status: 200,
        }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('disables both buttons until there is something to undo', () => {
    render(<HistoryHarness />);

    expect(undoButton()).toBeDisabled();
    expect(redoButton()).toBeDisabled();
  });

  it.each([
    {
      name: 'continuous typing',
      edit: async (user: User) => {
        await user.type(screen.getByRole('textbox'), 'abc');
      },
      edited: 'abc',
    },
    {
      name: 'a format button',
      edit: (user: User) => clickButton(user, 'Bold'),
      edited: '****',
    },
    {
      name: 'an inserted symbol',
      edit: async (user: User) => {
        await user.click(
          await screen.findByRole('button', { name: 'Symbols' }),
        );
        await user.click(screen.getByRole('menuitem', { name: '→' }));
      },
      edited: '→',
    },
    {
      name: 'an appended template',
      edit: (user: User) => clickButton(user, 'Divider'),
      edited: '---',
    },
  ])('undoes and redoes $name as a single step', async ({ edit, edited }) => {
    const user = userEvent.setup();
    render(<HistoryHarness />);
    const textarea = screen.getByRole('textbox');

    await edit(user);
    expect(textarea).toHaveValue(edited);
    expect(undoButton()).toBeEnabled();
    expect(redoButton()).toBeDisabled();

    await user.click(undoButton());
    expect(textarea).toHaveValue('');
    expect(undoButton()).toBeDisabled();
    expect(redoButton()).toBeEnabled();

    await user.click(redoButton());
    expect(textarea).toHaveValue(edited);
    expect(undoButton()).toBeEnabled();
    expect(redoButton()).toBeDisabled();
  });

  it('steps through multiple edits in order', async () => {
    const user = userEvent.setup();
    render(<HistoryHarness />);
    const textarea = screen.getByRole('textbox');

    await clickButton(user, 'Bold');
    await clickButton(user, 'Divider');
    expect(textarea).toHaveValue('****---');

    await user.click(undoButton());
    expect(textarea).toHaveValue('****');
    await user.click(undoButton());
    expect(textarea).toHaveValue('');

    await user.click(redoButton());
    expect(textarea).toHaveValue('****');
    await user.click(redoButton());
    expect(textarea).toHaveValue('****---');
  });

  it('discards the redo steps once a new edit is made', async () => {
    const user = userEvent.setup();
    render(<HistoryHarness />);

    await clickButton(user, 'Bold');
    await user.click(undoButton());
    await clickButton(user, 'Divider');

    expect(screen.getByRole('textbox')).toHaveValue('---');
    expect(redoButton()).toBeDisabled();
  });

  it.each([
    { name: 'Ctrl+Y', redoKeys: '{Control>}y{/Control}' },
    {
      name: 'Ctrl+Shift+Z',
      redoKeys: '{Control>}{Shift>}z{/Shift}{/Control}',
    },
  ])('undoes with Ctrl+Z and redoes with $name', async ({ redoKeys }) => {
    const user = userEvent.setup();
    render(<HistoryHarness />);
    const textarea = screen.getByRole('textbox');

    await clickButton(user, 'Bold');
    await user.click(textarea);

    await user.keyboard('{Control>}z{/Control}');
    expect(textarea).toHaveValue('');

    await user.keyboard(redoKeys);
    expect(textarea).toHaveValue('****');
  });

  it('clears the history when the value is replaced from outside', async () => {
    const user = userEvent.setup();
    render(<HistoryHarness />);

    await clickButton(user, 'Bold');
    await clickButton(user, 'Load');

    expect(screen.getByRole('textbox')).toHaveValue('loaded');
    expect(undoButton()).toBeDisabled();
    expect(redoButton()).toBeDisabled();
  });

  it('disables undo in preview mode and keeps the history for when editing resumes', async () => {
    const user = userEvent.setup();
    render(<HistoryHarness />);

    await clickButton(user, 'Bold');
    await clickButton(user, 'Preview');
    expect(undoButton()).toBeDisabled();

    await clickButton(user, 'Edit');
    expect(undoButton()).toBeEnabled();
  });
});
