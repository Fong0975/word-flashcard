import { render, screen } from '@testing-library/react';

import { AnswerReviewList } from './AnswerReviewList';

const options = [
  { key: 'A', value: '4', originalKey: 'A' },
  { key: 'B', value: '3', originalKey: 'B' },
];

describe('AnswerReviewList', () => {
  it('marks the correct option', () => {
    render(
      <AnswerReviewList
        options={options}
        selectedAnswer='A'
        correctAnswer='A'
        isCorrect
      />,
    );

    expect(screen.getByText('✓ Correct')).toBeInTheDocument();
    expect(screen.queryByText('✗ Your Answer')).not.toBeInTheDocument();
  });

  it('marks the user’s wrong answer when incorrect', () => {
    render(
      <AnswerReviewList
        options={options}
        selectedAnswer='B'
        correctAnswer='A'
        isCorrect={false}
      />,
    );

    expect(screen.getByText('✓ Correct')).toBeInTheDocument();
    expect(screen.getByText('✗ Your Answer')).toBeInTheDocument();
  });

  it('renders every option value', () => {
    render(
      <AnswerReviewList
        options={options}
        selectedAnswer={null}
        correctAnswer='A'
        isCorrect={false}
      />,
    );

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
