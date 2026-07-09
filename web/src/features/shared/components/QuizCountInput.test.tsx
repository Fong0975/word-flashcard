import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QuizCountInput } from './QuizCountInput';

const baseProps = {
  value: '15',
  onChange: jest.fn(),
  error: '',
  count: 15,
  minCount: 1,
  maxCount: 100,
  quickOptions: [5, 10, 15, 20],
  onQuickSelect: jest.fn(),
};

describe('QuizCountInput', () => {
  it('renders the current value', () => {
    render(<QuizCountInput {...baseProps} />);
    expect(screen.getByRole('spinbutton')).toHaveValue(15);
  });

  it('calls onChange as the user types', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<QuizCountInput {...baseProps} value='' onChange={onChange} />);

    await user.type(screen.getByRole('spinbutton'), '5');
    expect(onChange).toHaveBeenCalledWith('5');
  });

  it('shows the pluralized question count hint', () => {
    render(<QuizCountInput {...baseProps} count={1} />);
    expect(
      screen.getByText('Quiz will contain 1 question.'),
    ).toBeInTheDocument();
  });

  it('pluralizes for counts other than one', () => {
    render(<QuizCountInput {...baseProps} count={5} />);
    expect(
      screen.getByText('Quiz will contain 5 questions.'),
    ).toBeInTheDocument();
  });

  it('shows an error message instead of the hint when there is an error', () => {
    render(
      <QuizCountInput {...baseProps} error='Please enter a valid number.' />,
    );
    expect(
      screen.getByText('Please enter a valid number.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Quiz will contain/)).not.toBeInTheDocument();
  });

  it('calls onQuickSelect with the chosen option', async () => {
    const user = userEvent.setup();
    const onQuickSelect = jest.fn();
    render(<QuizCountInput {...baseProps} onQuickSelect={onQuickSelect} />);

    await user.click(screen.getByRole('button', { name: '20' }));
    expect(onQuickSelect).toHaveBeenCalledWith(20);
  });
});
