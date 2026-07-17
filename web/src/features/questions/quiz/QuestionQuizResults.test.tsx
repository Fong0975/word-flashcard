import { render, screen } from '@testing-library/react';

import { Question, QuestionQuizResult } from '../../../types/api';

import { QuestionQuizResults } from './QuestionQuizResults';

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

const buildResult = (
  overrides: Partial<QuestionQuizResult> = {},
): QuestionQuizResult => ({
  question: buildQuestion(),
  userAnswer: 'A',
  isCorrect: true,
  updatedStats: { countPractise: 1, countFailurePractise: 0 },
  ...overrides,
});

describe('QuestionQuizResults', () => {
  it('renders the accuracy percentage and the score breakdown', () => {
    const results: QuestionQuizResult[] = [
      buildResult({ isCorrect: true }),
      buildResult({ isCorrect: true }),
      buildResult({ isCorrect: true }),
      buildResult({ isCorrect: false }),
    ];

    render(<QuestionQuizResults results={results} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('3 out of 4 correct')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('shows the top performance message at 100% accuracy', () => {
    render(
      <QuestionQuizResults results={[buildResult({ isCorrect: true })]} />,
    );

    expect(
      screen.getByText(
        'Excellent! You have a great understanding of the material.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the lowest performance message below 60% accuracy', () => {
    render(
      <QuestionQuizResults
        results={[
          buildResult({ isCorrect: true }),
          buildResult({ isCorrect: false }),
        ]}
      />,
    );

    expect(
      screen.getByText('Keep studying! Review the explanations and try again.'),
    ).toBeInTheDocument();
  });

  it('shows the 80-89% performance message', () => {
    // 8 correct out of 10 rounds to exactly 80%.
    const results: QuestionQuizResult[] = [
      ...Array(8)
        .fill(null)
        .map(() => buildResult({ isCorrect: true })),
      ...Array(2)
        .fill(null)
        .map(() => buildResult({ isCorrect: false })),
    ];

    render(<QuestionQuizResults results={results} />);

    expect(
      screen.getByText('Great job! Your performance is very good.'),
    ).toBeInTheDocument();
  });

  it('shows the 60-69% performance message', () => {
    // 6 correct out of 10 rounds to exactly 60%.
    const results: QuestionQuizResult[] = [
      ...Array(6)
        .fill(null)
        .map(() => buildResult({ isCorrect: true })),
      ...Array(4)
        .fill(null)
        .map(() => buildResult({ isCorrect: false })),
    ];

    render(<QuestionQuizResults results={results} />);

    expect(
      screen.getByText(
        'Nice effort! Consider reviewing the questions you missed.',
      ),
    ).toBeInTheDocument();
  });

  it('shows each question, marking correct vs incorrect', () => {
    render(
      <QuestionQuizResults
        results={[
          buildResult({
            question: buildQuestion({ id: 1, question: 'Correct one?' }),
            userAnswer: 'A',
            isCorrect: true,
          }),
          buildResult({
            // A distinct correct-answer letter ('C') keeps this result's
            // "Your Answer"/"Correct Answer" text from colliding with the
            // first result's "(A) 4", which also happens to be its answer.
            question: buildQuestion({
              id: 2,
              question: 'Missed one?',
              answer: 'C',
            }),
            userAnswer: 'B',
            isCorrect: false,
          }),
        ]}
      />,
    );

    expect(screen.getByText('Correct one?')).toBeInTheDocument();
    expect(screen.getByText('Missed one?')).toBeInTheDocument();
    expect(screen.getByText('✓ Correct')).toBeInTheDocument();
    expect(screen.getByText('✗ Incorrect')).toBeInTheDocument();

    // Only the missed question should surface the "Correct Answer" callout.
    expect(screen.getAllByText('Correct Answer:')).toHaveLength(1);
    expect(screen.getByText('(B) 3')).toBeInTheDocument(); // user's answer
    expect(screen.getByText('(C) 5')).toBeInTheDocument(); // correct answer
  });

  it('shows the option D text when the user answered D', () => {
    render(
      <QuestionQuizResults
        results={[buildResult({ userAnswer: 'D', isCorrect: true })]}
      />,
    );

    expect(screen.getByText('(D) 6')).toBeInTheDocument();
  });

  it('renders no option text for an answer letter outside A-D', () => {
    render(
      <QuestionQuizResults
        results={[
          buildResult({
            question: buildQuestion({ answer: 'A' }),
            userAnswer: 'E',
            isCorrect: false,
          }),
        ]}
      />,
    );

    // getOptionText's default branch returns null, so "Your Answer" renders
    // just the bare letter with no option text after it.
    expect(screen.getByText('(E)')).toBeInTheDocument();
  });

  it('shows "No answer" when a question was left unanswered', () => {
    render(
      <QuestionQuizResults
        results={[buildResult({ userAnswer: null, isCorrect: false })]}
      />,
    );

    expect(screen.getByText('No answer')).toBeInTheDocument();
  });

  it('renders gracefully with an empty results list', () => {
    render(<QuestionQuizResults results={[]} />);

    expect(screen.getByText('0 out of 0 correct')).toBeInTheDocument();
  });
});
