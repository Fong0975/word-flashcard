import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QuestionInput } from './QuestionInput';

describe('QuestionInput', () => {
  it('renders the current value', () => {
    render(<QuestionInput value='What is 2 + 2?' onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('What is 2 + 2?');
  });

  it('calls onChange as the user types', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<QuestionInput value='' onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('disables the textarea when disabled is set', () => {
    render(<QuestionInput value='' onChange={jest.fn()} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('autofocuses when requested', () => {
    render(<QuestionInput value='' onChange={jest.fn()} autoFocus />);
    expect(screen.getByRole('textbox')).toHaveFocus();
  });
});
