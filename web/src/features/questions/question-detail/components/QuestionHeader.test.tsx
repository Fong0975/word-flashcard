import { render, screen } from '@testing-library/react';

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
        onEdit={vi.fn()}
        onCopy={vi.fn()}
        onDelete={vi.fn()}
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
        onEdit={vi.fn()}
        onCopy={vi.fn()}
        onDelete={vi.fn()}
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
        onEdit={vi.fn()}
        onCopy={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Reference:/)).not.toBeInTheDocument();
  });
});
