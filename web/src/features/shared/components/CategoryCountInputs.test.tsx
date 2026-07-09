import { render, screen, fireEvent } from '@testing-library/react';

import { FamiliarityLevel } from '../../../types/base';

import { CategoryCountInputs } from './CategoryCountInputs';

const buildProps = () => ({
  categoryInputs: {
    [FamiliarityLevel.RED]: '7',
    [FamiliarityLevel.YELLOW]: '5',
    [FamiliarityLevel.GREEN]: '3',
  },
  categoryCounts: {
    [FamiliarityLevel.RED]: 7,
    [FamiliarityLevel.YELLOW]: 5,
    [FamiliarityLevel.GREEN]: 3,
  },
  onChange: jest.fn(),
  maxCount: 100,
  allZero: false,
});

describe('CategoryCountInputs', () => {
  it('renders a labeled input for each familiarity category', () => {
    render(<CategoryCountInputs {...buildProps()} />);

    expect(screen.getByText('Unfamiliar')).toBeInTheDocument();
    expect(screen.getByText('Somewhat Familiar')).toBeInTheDocument();
    expect(screen.getByText('Familiar')).toBeInTheDocument();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(3);
  });

  it('shows the sum of the category counts as the total', () => {
    render(<CategoryCountInputs {...buildProps()} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('calls onChange with the category and the new value', () => {
    const onChange = jest.fn();
    render(<CategoryCountInputs {...buildProps()} onChange={onChange} />);

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '9' } });

    expect(onChange).toHaveBeenCalledWith(FamiliarityLevel.RED, '9');
  });

  it('shows a warning when every category is zero', () => {
    render(<CategoryCountInputs {...buildProps()} allZero />);
    expect(
      screen.getByText(
        'Please set at least one category count greater than 0.',
      ),
    ).toBeInTheDocument();
  });

  it('does not show the warning otherwise', () => {
    render(<CategoryCountInputs {...buildProps()} />);
    expect(
      screen.queryByText(
        'Please set at least one category count greater than 0.',
      ),
    ).not.toBeInTheDocument();
  });
});
