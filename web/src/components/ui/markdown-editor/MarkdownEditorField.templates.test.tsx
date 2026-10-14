import { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MarkdownEditorField } from './MarkdownEditorField';

type User = ReturnType<typeof userEvent.setup>;

const TemplateHarness = ({ initialValue }: { initialValue: string }) => {
  const [value, setValue] = useState(initialValue);
  return (
    <MarkdownEditorField
      value={value}
      onChange={setValue}
      templateButtons={[{ label: 'Divider', value: '---' }]}
    />
  );
};

describe('MarkdownEditorField template buttons', () => {
  const tests: {
    name: string;
    initialValue: string;
    /** Places the caret (or not) before the template button is clicked. */
    placeCaret: (textarea: HTMLTextAreaElement, user: User) => Promise<void>;
    expected: string;
  }[] = [
    {
      name: 'appends to empty content before a caret is placed',
      initialValue: '',
      placeCaret: async () => {},
      expected: '---',
    },
    {
      name: 'appends on a new line before a caret is placed',
      initialValue: 'abc',
      placeCaret: async () => {},
      expected: 'abc\n---',
    },
    {
      name: 'inserts at the caret without adding line breaks',
      initialValue: 'abc',
      placeCaret: async textarea => {
        act(() => textarea.focus());
        textarea.setSelectionRange(1, 1);
      },
      expected: 'a---bc',
    },
    {
      name: 'replaces the current selection',
      initialValue: 'abcd',
      placeCaret: async textarea => {
        act(() => textarea.focus());
        textarea.setSelectionRange(1, 3);
      },
      expected: 'a---d',
    },
    {
      name: 'appends again after the textarea is remounted by preview',
      initialValue: 'abc',
      placeCaret: async (textarea, user) => {
        act(() => textarea.focus());
        textarea.setSelectionRange(1, 1);
        await user.click(screen.getByRole('button', { name: 'Preview' }));
        await user.click(screen.getByRole('button', { name: 'Edit' }));
      },
      expected: 'abc\n---',
    },
  ];

  it.each(tests)('$name', async ({ initialValue, placeCaret, expected }) => {
    const user = userEvent.setup();
    render(<TemplateHarness initialValue={initialValue} />);

    await placeCaret(screen.getByRole('textbox') as HTMLTextAreaElement, user);
    await user.click(screen.getByRole('button', { name: 'Divider' }));

    expect(screen.getByRole('textbox')).toHaveValue(expected);
  });
});
