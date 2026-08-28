import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { apiService } from '../../../lib/api';
import { Word } from '../../../types/api';
import { FamiliarityLevel } from '../../../types/base';

import { MarkdownEditorField } from './MarkdownEditorField';

const ControlledMarkdownEditorField = () => {
  const [value, setValue] = useState('');
  return <MarkdownEditorField value={value} onChange={setValue} />;
};

describe('MarkdownEditorField', () => {
  it('associates the label with the textarea', () => {
    render(
      <MarkdownEditorField
        id='notes'
        label='Notes'
        value=''
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('calls onChange as the user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <MarkdownEditorField value='' onChange={onChange} />,
    );

    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');

    rerender(<MarkdownEditorField value='a' onChange={onChange} />);
    expect(screen.getByRole('textbox')).toHaveValue('a');
  });

  it('shows a placeholder message in preview mode when empty', async () => {
    const user = userEvent.setup();
    render(<MarkdownEditorField value='' onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Preview' }));

    expect(screen.getByText('Nothing to preview.')).toBeInTheDocument();
  });

  it('renders the value as markdown in preview mode', async () => {
    const user = userEvent.setup();
    render(<MarkdownEditorField value='**bold**' onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Preview' }));

    const strong = screen.getByText('bold');
    expect(strong.tagName).toBe('STRONG');
  });

  it('applies bold formatting to an empty value at the cursor', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MarkdownEditorField value='' onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Bold' }));

    expect(onChange).toHaveBeenCalledWith('****');
  });

  it('renders template buttons and forwards selections when onAppendTemplate is provided', async () => {
    const user = userEvent.setup();
    const onAppendTemplate = vi.fn();
    render(
      <MarkdownEditorField
        value=''
        onChange={vi.fn()}
        templateButtons={[{ label: 'Divider', value: '---' }]}
        onAppendTemplate={onAppendTemplate}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Divider' }));
    expect(onAppendTemplate).toHaveBeenCalledWith('---');
  });

  it('does not render template buttons without onAppendTemplate', () => {
    render(
      <MarkdownEditorField
        value=''
        onChange={vi.fn()}
        templateButtons={[{ label: 'Divider', value: '---' }]}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Divider' }),
    ).not.toBeInTheDocument();
  });

  it('disables the textarea when disabled is set', () => {
    render(<MarkdownEditorField value='' onChange={vi.fn()} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  describe('word link suggestions', () => {
    const buildWord = (overrides: Partial<Word> = {}): Word => ({
      id: 1,
      word: 'apple',
      familiarity: FamiliarityLevel.GREEN,
      reminder: null,
      count_practise: 0,
      definitions: [],
      ...overrides,
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('shows a suggestion and inserts a word link into the value when accepted', async () => {
      vi.spyOn(apiService, 'searchWords').mockResolvedValue([
        buildWord({ word: 'apple' }),
      ]);
      const user = userEvent.setup();
      render(<ControlledMarkdownEditorField />);

      await user.type(screen.getByRole('textbox'), '`apple`');

      const insertButton = await screen.findByRole('button', {
        name: 'Add link',
      });
      await user.click(insertButton);

      expect(screen.getByRole('textbox')).toHaveValue(
        '`apple`([link](/word/apple))',
      );
      expect(
        screen.queryByRole('button', { name: 'Add link' }),
      ).not.toBeInTheDocument();
    });

    it('dismisses the suggestion without changing the value when Skip is clicked', async () => {
      vi.spyOn(apiService, 'searchWords').mockResolvedValue([
        buildWord({ word: 'apple' }),
      ]);
      const user = userEvent.setup();
      render(<ControlledMarkdownEditorField />);

      await user.type(screen.getByRole('textbox'), '`apple`');

      const skipButton = await screen.findByRole('button', { name: 'Skip' });
      await user.click(skipButton);

      expect(screen.getByRole('textbox')).toHaveValue('`apple`');
      expect(
        screen.queryByRole('button', { name: 'Add link' }),
      ).not.toBeInTheDocument();
    });

    it('does not show a suggestion when the typed word is not a saved word', async () => {
      vi.spyOn(apiService, 'searchWords').mockResolvedValue([]);
      const user = userEvent.setup();
      render(<ControlledMarkdownEditorField />);

      await user.type(screen.getByRole('textbox'), '`banana`');

      await waitFor(() => expect(apiService.searchWords).toHaveBeenCalled());
      expect(
        screen.queryByRole('button', { name: 'Add link' }),
      ).not.toBeInTheDocument();
    });

    it('surfaces a suggestion on blur for a word pasted into an existing empty backtick pair', async () => {
      vi.spyOn(apiService, 'searchWords').mockResolvedValue([
        buildWord({ word: 'apple' }),
      ]);
      const user = userEvent.setup();
      render(<ControlledMarkdownEditorField />);
      const textarea = screen.getByRole('textbox');

      // Types an empty `` ` ` `` pair, moves the cursor back between the two
      // backticks, then pastes into it — the cursor ends up right after the
      // pasted word, not after the closing backtick, so the typing-driven
      // detection never fires.
      await user.type(textarea, '``{ArrowLeft}');
      await user.paste('apple');

      expect(textarea).toHaveValue('`apple`');
      expect(
        screen.queryByRole('button', { name: 'Add link' }),
      ).not.toBeInTheDocument();

      fireEvent.blur(textarea);

      expect(
        await screen.findByRole('button', { name: 'Add link' }),
      ).toBeInTheDocument();
    });

    it('surfaces multiple missed suggestions in sequence on blur, with progress', async () => {
      vi.spyOn(apiService, 'searchWords').mockImplementation(
        async (params = {}) => {
          const queriedWord = params.searchFilter?.conditions[0]?.value;
          return queriedWord === 'apple' || queriedWord === 'banana'
            ? [buildWord({ word: queriedWord })]
            : [];
        },
      );
      const user = userEvent.setup();
      render(<ControlledMarkdownEditorField />);
      const textarea = screen.getByRole('textbox');

      // Simulates pasting a whole block of text containing two backtick
      // words at once, ending on a space so the typing-driven detection
      // doesn't fire for either pair.
      fireEvent.change(textarea, { target: { value: '`apple` `banana` ' } });
      expect(
        screen.queryByRole('button', { name: 'Add link' }),
      ).not.toBeInTheDocument();

      fireEvent.blur(textarea);

      const firstInsert = await screen.findByRole('button', {
        name: 'Add link',
      });
      expect(screen.getByText(/1 of 2/)).toBeInTheDocument();
      await user.click(firstInsert);

      const secondInsert = await screen.findByRole('button', {
        name: 'Add link',
      });
      expect(screen.getByText(/2 of 2/)).toBeInTheDocument();
      await user.click(secondInsert);

      expect(
        screen.queryByRole('button', { name: 'Add link' }),
      ).not.toBeInTheDocument();
      expect((textarea as HTMLTextAreaElement).value).toContain(
        '([link](/word/apple))',
      );
      expect((textarea as HTMLTextAreaElement).value).toContain(
        '([link](/word/banana))',
      );
    });
  });
});
