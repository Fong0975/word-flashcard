import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WordInput } from './WordInput';

describe('WordInput', () => {
  it('renders the current value', () => {
    render(
      <WordInput
        value='apple'
        onChange={vi.fn()}
        onSearchChange={vi.fn()}
        disabled={false}
      />,
    );
    expect(screen.getByRole('textbox')).toHaveValue('apple');
  });

  it('calls both onChange and onSearchChange as the user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSearchChange = vi.fn();
    render(
      <WordInput
        value=''
        onChange={onChange}
        onSearchChange={onSearchChange}
        disabled={false}
      />,
    );

    await user.type(screen.getByRole('textbox'), 'a');

    expect(onChange).toHaveBeenCalledWith('a');
    expect(onSearchChange).toHaveBeenCalledWith('a');
  });

  it('disables the input when disabled is set', () => {
    render(
      <WordInput
        value=''
        onChange={vi.fn()}
        onSearchChange={vi.fn()}
        disabled
      />,
    );
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('autofocuses when requested', () => {
    render(
      <WordInput
        value=''
        onChange={vi.fn()}
        onSearchChange={vi.fn()}
        disabled={false}
        autoFocus
      />,
    );
    expect(screen.getByRole('textbox')).toHaveFocus();
  });
});
