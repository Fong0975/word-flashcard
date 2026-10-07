import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { Question } from '../../types/api';

import { QuestionCard } from './QuestionCard';

const buildQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 5,
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

const renderWithRouter = (question: Question) =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path='/'
          element={<QuestionCard index={1} question={question} />}
        />
        <Route path='/question/:id' element={<div>Question detail page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('QuestionCard', () => {
  it('renders the question text and its options', () => {
    renderWithRouter(buildQuestion());
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows a "No Practice" badge when never practiced', () => {
    renderWithRouter(buildQuestion({ count_practise: 0 }));
    expect(screen.getByText('No Practice')).toBeInTheDocument();
  });

  it('shows the accuracy rate once practiced', () => {
    renderWithRouter(
      buildQuestion({ count_practise: 10, count_failure_practise: 2 }),
    );
    expect(screen.getByText('Accuracy 80%')).toBeInTheDocument();
  });

  it('shows the error count only when there have been failures', () => {
    renderWithRouter(
      buildQuestion({ count_practise: 10, count_failure_practise: 3 }),
    );
    expect(screen.getByText(/Errors: 3/)).toBeInTheDocument();
  });

  it.each([
    {
      name: 'never practiced',
      overrides: { count_practise: 0, count_failure_practise: 0 },
      textColor: 'text-supporting',
      toneClass: null,
    },
    {
      name: 'high accuracy',
      overrides: { count_practise: 2, count_failure_practise: 0 },
      textColor: 'text-green-700',
      toneClass: 'glass-glow-green',
    },
    {
      name: 'medium accuracy',
      overrides: { count_practise: 4, count_failure_practise: 1 },
      textColor: 'text-yellow-700',
      toneClass: 'glass-glow-yellow',
    },
    {
      name: 'low accuracy',
      overrides: { count_practise: 4, count_failure_practise: 3 },
      textColor: 'text-red-700',
      toneClass: 'glass-glow-red',
    },
  ])(
    'tints the statistics and the accuracy bar for $name',
    ({ overrides, textColor, toneClass }) => {
      renderWithRouter(buildQuestion(overrides));

      expect(screen.getByTestId('question-stats')).toHaveClass(textColor);

      const bar = screen.getByTestId('accuracy-bar');
      if (toneClass === null) {
        expect(bar.className).not.toMatch(/glass-glow-(green|yellow|red)/);
      } else {
        expect(bar).toHaveClass(toneClass);
      }
    },
  );

  it('navigates to the question detail page when clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(buildQuestion({ id: 5 }));

    await user.click(screen.getByText('What is 2 + 2?'));
    expect(screen.getByText('Question detail page')).toBeInTheDocument();
  });
});
