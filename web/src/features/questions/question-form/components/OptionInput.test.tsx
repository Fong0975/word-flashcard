import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OptionInput } from './OptionInput';

describe('OptionInput', () => {
  it('marks option A as required by default', () => {
    render(<OptionInput option='A' value='' onChange={jest.fn()} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not mark option B as required by default', () => {
    render(<OptionInput option='B' value='' onChange={jest.fn()} />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('marks a non-A option as required when explicitly requested', () => {
    render(<OptionInput option='B' value='' onChange={jest.fn()} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('calls onChange with the option and the new value', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<OptionInput option='C' value='' onChange={onChange} />);

    await user.type(screen.getByLabelText(/Option C/), 'x');
    expect(onChange).toHaveBeenCalledWith('C', 'x');
  });

  it('disables the input when disabled is set', () => {
    render(<OptionInput option='A' value='' onChange={jest.fn()} disabled />);
    expect(screen.getByLabelText(/Option A/)).toBeDisabled();
  });
});
