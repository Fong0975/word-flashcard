import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OptionsGroup } from './OptionsGroup';

const options = { A: '4', B: '3', C: '5', D: '6' };

describe('OptionsGroup', () => {
  it('renders an input for every option with the current values', () => {
    render(<OptionsGroup options={options} onChange={jest.fn()} />);

    expect(screen.getByLabelText(/Option A/)).toHaveValue('4');
    expect(screen.getByLabelText(/Option B/)).toHaveValue('3');
    expect(screen.getByLabelText(/Option C/)).toHaveValue('5');
    expect(screen.getByLabelText(/Option D/)).toHaveValue('6');
  });

  it('marks only option A as required', () => {
    render(<OptionsGroup options={options} onChange={jest.fn()} />);
    expect(screen.getAllByText('*')).toHaveLength(1);
  });

  it('delegates changes to the onChange handler with the option and value', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<OptionsGroup options={options} onChange={onChange} />);

    await user.type(screen.getByLabelText(/Option B/), 'x');
    expect(onChange).toHaveBeenCalledWith('B', '3x');
  });

  it('disables every input when disabled is set', () => {
    render(<OptionsGroup options={options} onChange={jest.fn()} disabled />);
    expect(screen.getByLabelText(/Option A/)).toBeDisabled();
    expect(screen.getByLabelText(/Option D/)).toBeDisabled();
  });
});
