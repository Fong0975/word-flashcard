import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Question } from '../../../../types/api';

import { AnswerSection } from './AnswerSection';

const buildQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 1,
  question: 'What is 2 + 2?',
  answer: 'A',
  option_a: '4',
  option_b: '3',
  option_c: '5',
  option_d: '6',
  count_failure_practise: 0,
  count_practise: 0,
  notes: '',
  reference: '',
  ...overrides,
});

describe('AnswerSection', () => {
  it('shows the header but hides the content while collapsed', () => {
    render(
      <AnswerSection
        isExpanded={false}
        onToggle={jest.fn()}
        answer='A'
        question={buildQuestion()}
      />,
    );

    expect(screen.getByText('Answer & Explanation')).toBeInTheDocument();
    expect(screen.queryByText('Correct Answer:')).not.toBeInTheDocument();
  });

  it('shows the correct answer content once expanded', () => {
    render(
      <AnswerSection
        isExpanded
        onToggle={jest.fn()}
        answer='B'
        question={buildQuestion()}
      />,
    );

    expect(screen.getByText('Correct Answer:')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows option_c content when the answer is C', () => {
    render(
      <AnswerSection
        isExpanded
        onToggle={jest.fn()}
        answer='C'
        question={buildQuestion()}
      />,
    );

    expect(screen.getByText('Correct Answer:')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows option_d content when the answer is D', () => {
    render(
      <AnswerSection
        isExpanded
        onToggle={jest.fn()}
        answer='D'
        question={buildQuestion()}
      />,
    );

    expect(screen.getByText('Correct Answer:')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('falls back to a not-found message for an unknown answer letter', () => {
    render(
      <AnswerSection
        isExpanded
        onToggle={jest.fn()}
        answer='Z'
        question={buildQuestion()}
      />,
    );

    expect(screen.getByText('Answer content not found')).toBeInTheDocument();
  });

  it('renders the explanation as markdown when provided', () => {
    render(
      <AnswerSection
        isExpanded
        onToggle={jest.fn()}
        answer='A'
        explanation='**important**'
        question={buildQuestion()}
      />,
    );

    const strong = screen.getByText('important');
    expect(strong.tagName).toBe('STRONG');
  });

  it('does not render an explanation section when absent', () => {
    render(
      <AnswerSection
        isExpanded
        onToggle={jest.fn()}
        answer='A'
        question={buildQuestion()}
      />,
    );

    expect(screen.queryByText('Explanation:')).not.toBeInTheDocument();
  });

  it('calls onToggle when the header is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    render(
      <AnswerSection
        isExpanded={false}
        onToggle={onToggle}
        answer='A'
        question={buildQuestion()}
      />,
    );

    await user.click(screen.getByText('Answer & Explanation'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
