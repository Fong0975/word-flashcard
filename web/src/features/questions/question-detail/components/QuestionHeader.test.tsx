import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Question } from '../../../../types/api';

import { QuestionHeader } from './QuestionHeader';

const buildQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 42,
  question: 'What is 2 + 2?',
  answer: 'A',
  option_a: '4',
  option_b: '3',
  option_c: '5',
  option_d: '6',
  count_failure_practise: 0,
  count_practise: 3,
  notes: '',
  reference: '',
  ...overrides,
});

describe('QuestionHeader', () => {
  it('renders the question id, text, and practice count', () => {
    render(
      <QuestionHeader
        question={buildQuestion()}
        onEdit={jest.fn()}
        onCopy={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(screen.getByText('Question ID: 42')).toBeInTheDocument();
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    expect(screen.getByText('Practiced 3 times')).toBeInTheDocument();
  });

  it('renders the reference when present', () => {
    render(
      <QuestionHeader
        question={buildQuestion({ reference: 'Math textbook p.12' })}
        onEdit={jest.fn()}
        onCopy={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Reference: Math textbook p.12'),
    ).toBeInTheDocument();
  });

  it('does not render a reference line when absent', () => {
    render(
      <QuestionHeader
        question={buildQuestion({ reference: '' })}
        onEdit={jest.fn()}
        onCopy={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(screen.queryByText(/Reference:/)).not.toBeInTheDocument();
  });

  it('delegates edit and delete clicks', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(
      <QuestionHeader
        question={buildQuestion()}
        onEdit={onEdit}
        onCopy={jest.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByTitle('Edit question'));
    expect(onEdit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTitle('Delete question'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
