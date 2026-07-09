import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Word } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';

import { WordQuizNavHeader } from './WordQuizNavHeader';

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.GREEN,
  reminder: null,
  count_practise: 0,
  definitions: [],
  ...overrides,
});

describe('WordQuizNavHeader', () => {
  it('renders the current progress', () => {
    render(
      <WordQuizNavHeader
        currentWordIndex={2}
        totalWords={10}
        progress={33.4}
        isFirstStep={false}
        showAnswer={false}
        currentWord={buildWord()}
        onPrev={jest.fn()}
        onNext={jest.fn()}
      />,
    );

    expect(screen.getByText('Question 3 of 10')).toBeInTheDocument();
    expect(screen.getByText('33% Complete')).toBeInTheDocument();
  });

  it('disables the Previous button on the first step', () => {
    render(
      <WordQuizNavHeader
        currentWordIndex={0}
        totalWords={10}
        progress={0}
        isFirstStep
        showAnswer={false}
        currentWord={buildWord()}
        onPrev={jest.fn()}
        onNext={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('calls onPrev and onNext when clicked', async () => {
    const user = userEvent.setup();
    const onPrev = jest.fn();
    const onNext = jest.fn();
    render(
      <WordQuizNavHeader
        currentWordIndex={1}
        totalWords={10}
        progress={10}
        isFirstStep={false}
        showAnswer={false}
        currentWord={buildWord()}
        onPrev={onPrev}
        onNext={onNext}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPrev).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('does not show the word when the answer is hidden', () => {
    render(
      <WordQuizNavHeader
        currentWordIndex={0}
        totalWords={10}
        progress={0}
        isFirstStep
        showAnswer={false}
        currentWord={buildWord({ word: 'banana' })}
        onPrev={jest.fn()}
        onNext={jest.fn()}
      />,
    );

    expect(screen.queryByText('banana')).not.toBeInTheDocument();
  });

  it('shows the word once the answer is revealed', () => {
    render(
      <WordQuizNavHeader
        currentWordIndex={0}
        totalWords={10}
        progress={0}
        isFirstStep
        showAnswer
        currentWord={buildWord({ word: 'banana' })}
        onPrev={jest.fn()}
        onNext={jest.fn()}
      />,
    );

    expect(screen.getByText('banana')).toBeInTheDocument();
  });
});
