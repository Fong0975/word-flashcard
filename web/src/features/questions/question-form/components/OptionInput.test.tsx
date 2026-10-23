import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OptionInputProps } from '../types/question-form';

import { OptionInput } from './OptionInput';

const renderOptionInput = (props: Partial<OptionInputProps> = {}) =>
  render(
    <OptionInput
      option='A'
      value=''
      onChange={vi.fn()}
      isCorrect={false}
      onSelectCorrect={vi.fn()}
      {...props}
    />,
  );

const getSwitch = (option: string) =>
  screen.getByRole('radio', {
    name: `Mark option ${option} as the correct answer`,
  });

describe('OptionInput', () => {
  it.each([
    { name: 'option A by default', props: { option: 'A' }, marked: true },
    { name: 'not option B by default', props: { option: 'B' }, marked: false },
    {
      name: 'a non-A option when explicitly requested',
      props: { option: 'B', required: true },
      marked: true,
    },
  ] as const)('marks $name as required', ({ props, marked }) => {
    renderOptionInput(props);
    if (marked) {
      expect(screen.getByText('*')).toBeInTheDocument();
    } else {
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    }
  });

  it('calls onChange with the option and the new value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderOptionInput({ option: 'C', onChange });

    await user.type(screen.getByLabelText(/Option C/), 'x');
    expect(onChange).toHaveBeenCalledWith('C', 'x');
  });

  it.each([
    { name: 'empty', value: '', disabled: false, switchDisabled: true },
    {
      name: 'whitespace-only',
      value: '   ',
      disabled: false,
      switchDisabled: true,
    },
    { name: 'filled', value: '4', disabled: false, switchDisabled: false },
    {
      name: 'filled but form-disabled',
      value: '4',
      disabled: true,
      switchDisabled: true,
    },
  ])(
    'sets the switch disabled state for a $name option',
    ({ value, disabled, switchDisabled }) => {
      renderOptionInput({ value, disabled });
      if (switchDisabled) {
        expect(getSwitch('A')).toBeDisabled();
      } else {
        expect(getSwitch('A')).toBeEnabled();
      }
    },
  );

  it.each([true, false])(
    'reflects isCorrect=%s as the switch checked state',
    isCorrect => {
      renderOptionInput({ value: '4', isCorrect });
      expect(getSwitch('A')).toHaveProperty('checked', isCorrect);
    },
  );

  it('calls onSelectCorrect with the option when its switch is clicked', async () => {
    const user = userEvent.setup();
    const onSelectCorrect = vi.fn();
    renderOptionInput({ option: 'D', value: '6', onSelectCorrect });

    await user.click(getSwitch('D'));
    expect(onSelectCorrect).toHaveBeenCalledWith('D');
  });

  it('disables the input when disabled is set', () => {
    renderOptionInput({ disabled: true });
    expect(screen.getByLabelText(/Option A/)).toBeDisabled();
  });
});
