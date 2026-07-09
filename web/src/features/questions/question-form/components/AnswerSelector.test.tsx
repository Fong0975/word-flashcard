import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AnswerSelector } from './AnswerSelector';

describe('AnswerSelector', () => {
  it('renders the current value', () => {
    render(<AnswerSelector value='B' onChange={jest.fn()} />);
    expect(screen.getByRole('combobox')).toHaveValue('B');
  });

  it('calls onChange with the selected option', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<AnswerSelector value='' onChange={onChange} />);

    await user.selectOptions(screen.getByRole('combobox'), 'C');
    expect(onChange).toHaveBeenCalledWith('C');
  });

  it('is disabled when the disabled prop is set', () => {
    render(<AnswerSelector value='' onChange={jest.fn()} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
