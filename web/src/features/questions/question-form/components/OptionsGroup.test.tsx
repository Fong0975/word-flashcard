import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { OptionsGroup } from './OptionsGroup';

const options = { A: '4', B: '3', C: '5', D: '6' };

const renderOptionsGroup = (
  props: Partial<ComponentProps<typeof OptionsGroup>> = {},
) =>
  render(
    <OptionsGroup
      options={options}
      onChange={vi.fn()}
      answer='B'
      onAnswerChange={vi.fn()}
      {...props}
    />,
  );

describe('OptionsGroup', () => {
  it('renders an input for every option with the current values, marking only option A as required', () => {
    renderOptionsGroup();

    expect(screen.getByLabelText(/Option A/)).toHaveValue('4');
    expect(screen.getByLabelText(/Option B/)).toHaveValue('3');
    expect(screen.getByLabelText(/Option C/)).toHaveValue('5');
    expect(screen.getByLabelText(/Option D/)).toHaveValue('6');
    // One marker on the group heading, one on option A.
    expect(screen.getAllByText('*')).toHaveLength(2);
  });

  it('renders the four switches in one radio group with only the answer checked', () => {
    renderOptionsGroup();

    const group = screen.getByRole('radiogroup', { name: /Options/ });
    const switches = screen.getAllByRole('radio');
    expect(switches).toHaveLength(4);
    switches.forEach(input => expect(group).toContainElement(input));
    expect(
      switches.filter(input => (input as HTMLInputElement).checked),
    ).toEqual([
      screen.getByRole('radio', {
        name: 'Mark option B as the correct answer',
      }),
    ]);
  });

  it('delegates changes to the onChange handler with the option and value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderOptionsGroup({ onChange });

    await user.type(screen.getByLabelText(/Option B/), 'x');
    expect(onChange).toHaveBeenCalledWith('B', '3x');
  });

  it('delegates switch clicks to onAnswerChange with the option', async () => {
    const user = userEvent.setup();
    const onAnswerChange = vi.fn();
    renderOptionsGroup({ onAnswerChange });

    await user.click(
      screen.getByRole('radio', {
        name: 'Mark option C as the correct answer',
      }),
    );
    expect(onAnswerChange).toHaveBeenCalledWith('C');
  });

  it('disables every input and switch when disabled is set', () => {
    renderOptionsGroup({ disabled: true });
    expect(screen.getByLabelText(/Option A/)).toBeDisabled();
    expect(screen.getByLabelText(/Option D/)).toBeDisabled();
    screen.getAllByRole('radio').forEach(input => expect(input).toBeDisabled());
  });
});
