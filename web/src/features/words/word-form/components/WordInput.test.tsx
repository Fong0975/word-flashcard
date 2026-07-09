import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WordInput } from './WordInput';

describe('WordInput', () => {
  it('renders the current value', () => {
    render(
      <WordInput
        value='apple'
        onChange={jest.fn()}
        onSearchChange={jest.fn()}
        disabled={false}
      />,
    );
    expect(screen.getByRole('textbox')).toHaveValue('apple');
  });

  it('calls both onChange and onSearchChange as the user types', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onSearchChange = jest.fn();
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
        onChange={jest.fn()}
        onSearchChange={jest.fn()}
        disabled
      />,
    );
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('autofocuses when requested', () => {
    render(
      <WordInput
        value=''
        onChange={jest.fn()}
        onSearchChange={jest.fn()}
        disabled={false}
        autoFocus
      />,
    );
    expect(screen.getByRole('textbox')).toHaveFocus();
  });
});
