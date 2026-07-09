import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MarkdownEditorField } from './MarkdownEditorField';

describe('MarkdownEditorField', () => {
  it('associates the label with the textarea', () => {
    render(
      <MarkdownEditorField
        id='notes'
        label='Notes'
        value=''
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('calls onChange as the user types', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
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
    render(<MarkdownEditorField value='' onChange={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Preview' }));

    expect(screen.getByText('Nothing to preview.')).toBeInTheDocument();
  });

  it('renders the value as markdown in preview mode', async () => {
    const user = userEvent.setup();
    render(<MarkdownEditorField value='**bold**' onChange={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Preview' }));

    const strong = screen.getByText('bold');
    expect(strong.tagName).toBe('STRONG');
  });

  it('applies bold formatting to an empty value at the cursor', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<MarkdownEditorField value='' onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Bold' }));

    expect(onChange).toHaveBeenCalledWith('****');
  });

  it('renders template buttons and forwards selections when onAppendTemplate is provided', async () => {
    const user = userEvent.setup();
    const onAppendTemplate = jest.fn();
    render(
      <MarkdownEditorField
        value=''
        onChange={jest.fn()}
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
        onChange={jest.fn()}
        templateButtons={[{ label: 'Divider', value: '---' }]}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Divider' }),
    ).not.toBeInTheDocument();
  });

  it('disables the textarea when disabled is set', () => {
    render(<MarkdownEditorField value='' onChange={jest.fn()} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
