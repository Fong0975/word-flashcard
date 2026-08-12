import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OptionsSelectionList } from './OptionsSelectionList';

const options = [
  { key: 'A', value: '4', originalKey: 'A' },
  { key: 'B', value: '3', originalKey: 'B' },
];

describe('OptionsSelectionList', () => {
  it('renders a radio button for each option', () => {
    render(
      <OptionsSelectionList
        options={options}
        selectedAnswer={null}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('checks the radio matching the selected answer', () => {
    render(
      <OptionsSelectionList
        options={options}
        selectedAnswer='B'
        onSelect={vi.fn()}
      />,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios[0]).not.toBeChecked();
    expect(radios[1]).toBeChecked();
  });

  it('calls onSelect with the chosen option key', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <OptionsSelectionList
        options={options}
        selectedAnswer={null}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getAllByRole('radio')[1]);
    expect(onSelect).toHaveBeenCalledWith('B');
  });
});
