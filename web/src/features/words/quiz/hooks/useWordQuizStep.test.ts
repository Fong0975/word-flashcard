import { renderHook, act } from '@testing-library/react';

import { Word } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';

import { useWordQuizStep } from './useWordQuizStep';

const buildWord = (
  id: number,
  familiarity: FamiliarityLevel = FamiliarityLevel.YELLOW,
): Word => ({
  id,
  word: `word-${id}`,
  familiarity,
  reminder: null,
  count_practise: 0,
  definitions: [],
});

describe('useWordQuizStep', () => {
  it('starts on the first word in the question stage', () => {
    const words = [buildWord(1), buildWord(2)];
    const { result } = renderHook(() => useWordQuizStep(words));

    expect(result.current.currentWordIndex).toBe(0);
    expect(result.current.showAnswer).toBe(false);
    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.isLastStep).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it.each([
    {
      name: 'falls back to the word familiarity when it has not been rated',
      words: [buildWord(1, FamiliarityLevel.RED)],
      decision: undefined,
      expected: FamiliarityLevel.RED,
    },
    {
      name: 'prefers the rating recorded for the current word',
      words: [buildWord(1, FamiliarityLevel.RED)],
      decision: { index: 0, level: FamiliarityLevel.GREEN },
      expected: FamiliarityLevel.GREEN,
    },
    {
      name: 'ignores a rating recorded for another word',
      words: [buildWord(1, FamiliarityLevel.RED), buildWord(2)],
      decision: { index: 1, level: FamiliarityLevel.GREEN },
      expected: FamiliarityLevel.RED,
    },
    {
      name: 'is undefined when there are no words',
      words: [],
      decision: undefined,
      expected: undefined,
    },
  ])('currentFamiliarity $name', ({ words, decision, expected }) => {
    const { result } = renderHook(() => useWordQuizStep(words));

    if (decision) {
      act(() => {
        result.current.recordDecision(decision.index, decision.level);
      });
    }

    expect(result.current.currentFamiliarity).toBe(expected);
  });

  it('advance moves from the question stage to the answer stage of the same word', () => {
    const words = [buildWord(1), buildWord(2)];
    const { result } = renderHook(() => useWordQuizStep(words));

    act(() => {
      result.current.advance();
    });

    expect(result.current.currentWordIndex).toBe(0);
    expect(result.current.showAnswer).toBe(true);
    expect(result.current.progress).toBe(50);
  });

  it('advance moves to the next word after the answer stage', () => {
    const words = [buildWord(1), buildWord(2)];
    const { result } = renderHook(() => useWordQuizStep(words));

    act(() => {
      result.current.advance();
    });
    act(() => {
      result.current.advance();
    });

    expect(result.current.currentWordIndex).toBe(1);
    expect(result.current.showAnswer).toBe(false);
  });

  it('reports isLastStep once the final word reaches the answer stage', () => {
    const words = [buildWord(1), buildWord(2)];
    const { result } = renderHook(() => useWordQuizStep(words));

    act(() => {
      result.current.advance(); // word 0 answer
    });
    act(() => {
      result.current.advance(); // word 1 question
    });
    act(() => {
      result.current.advance(); // word 1 answer
    });

    expect(result.current.currentWordIndex).toBe(1);
    expect(result.current.showAnswer).toBe(true);
    expect(result.current.isLastStep).toBe(true);
    expect(result.current.progress).toBe(100);
  });

  it('goBack from a word question stage lands on the previous word answer stage', () => {
    const words = [buildWord(1), buildWord(2)];
    const { result } = renderHook(() => useWordQuizStep(words));

    act(() => {
      result.current.advance(); // word 0 answer
    });
    act(() => {
      result.current.advance(); // word 1 question
    });
    act(() => {
      result.current.goBack();
    });

    expect(result.current.currentWordIndex).toBe(0);
    expect(result.current.showAnswer).toBe(true);
  });

  it('goBack from an answer stage returns to that word question stage', () => {
    const words = [buildWord(1), buildWord(2)];
    const { result } = renderHook(() => useWordQuizStep(words));

    act(() => {
      result.current.advance(); // word 0 answer
    });
    act(() => {
      result.current.goBack();
    });

    expect(result.current.currentWordIndex).toBe(0);
    expect(result.current.showAnswer).toBe(false);
  });

  it('records a decision for a word index', () => {
    const words = [buildWord(1), buildWord(2)];
    const { result } = renderHook(() => useWordQuizStep(words));

    act(() => {
      result.current.recordDecision(0, FamiliarityLevel.GREEN);
    });

    expect(result.current.decisions).toEqual({ 0: FamiliarityLevel.GREEN });
  });

  it('buildAllResults falls back to the original familiarity for undecided words', () => {
    const words = [
      buildWord(1, FamiliarityLevel.RED),
      buildWord(2, FamiliarityLevel.YELLOW),
    ];
    const { result } = renderHook(() => useWordQuizStep(words));

    act(() => {
      result.current.recordDecision(0, FamiliarityLevel.GREEN);
    });

    const results = result.current.buildAllResults();
    expect(results).toEqual([
      {
        word: words[0],
        oldFamiliarity: FamiliarityLevel.RED,
        newFamiliarity: FamiliarityLevel.GREEN,
      },
      {
        word: words[1],
        oldFamiliarity: FamiliarityLevel.YELLOW,
        newFamiliarity: FamiliarityLevel.YELLOW,
      },
    ]);
  });

  it('buildAllResults lets extraDecisions override the recorded decisions', () => {
    const words = [buildWord(1, FamiliarityLevel.RED)];
    const { result } = renderHook(() => useWordQuizStep(words));

    act(() => {
      result.current.recordDecision(0, FamiliarityLevel.GREEN);
    });

    const results = result.current.buildAllResults({
      0: FamiliarityLevel.YELLOW,
    });
    expect(results[0].newFamiliarity).toBe(FamiliarityLevel.YELLOW);
  });
});
