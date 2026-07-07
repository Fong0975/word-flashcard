import { useState } from 'react';

import { Word, WordQuizResult } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';

type QuizStage = 'question' | 'answer';

interface UseWordQuizStepReturn {
  currentWordIndex: number;
  currentWord: Word;
  showAnswer: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
  decisions: Record<number, FamiliarityLevel>;
  recordDecision: (index: number, level: FamiliarityLevel) => void;
  advance: () => void;
  goBack: () => void;
  buildAllResults: (
    extraDecisions?: Record<number, FamiliarityLevel>,
  ) => WordQuizResult[];
}

/**
 * Tracks progression through a word quiz: which word is current, whether the
 * question or answer stage is showing, and the familiarity decisions made so
 * far.
 *
 * Each word is shown in two stages (question, then answer), so navigating
 * "forward" advances the stage first and only moves to the next word once
 * the answer stage has been seen; "back" is the exact inverse, which means
 * going back from a word's question stage lands on the *previous* word's
 * answer stage (letting the user review what they just rated).
 */
export const useWordQuizStep = (words: Word[]): UseWordQuizStepReturn => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [stage, setStage] = useState<QuizStage>('question');
  const [decisions, setDecisions] = useState<Record<number, FamiliarityLevel>>(
    {},
  );

  const showAnswer = stage === 'answer';
  const isFirstStep = currentWordIndex === 0 && stage === 'question';
  const isLastStep =
    words.length > 0 &&
    currentWordIndex === words.length - 1 &&
    stage === 'answer';
  const progress =
    words.length > 0
      ? ((currentWordIndex + (showAnswer ? 1 : 0)) / words.length) * 100
      : 0;
  const currentWord = words[currentWordIndex];

  const recordDecision = (index: number, level: FamiliarityLevel) => {
    setDecisions(prev => ({ ...prev, [index]: level }));
  };

  const advance = () => {
    if (stage === 'question') {
      setStage('answer');
    } else {
      setCurrentWordIndex(prev => prev + 1);
      setStage('question');
    }
  };

  const goBack = () => {
    if (stage === 'answer') {
      setStage('question');
    } else {
      setCurrentWordIndex(prev => prev - 1);
      setStage('answer');
    }
  };

  const buildAllResults = (
    extraDecisions?: Record<number, FamiliarityLevel>,
  ): WordQuizResult[] => {
    const allDecisions = { ...decisions, ...extraDecisions };
    return words.map((word, index) => ({
      word,
      oldFamiliarity: word.familiarity,
      newFamiliarity: allDecisions[index] ?? word.familiarity,
    }));
  };

  return {
    currentWordIndex,
    currentWord,
    showAnswer,
    isFirstStep,
    isLastStep,
    progress,
    decisions,
    recordDecision,
    advance,
    goBack,
    buildAllResults,
  };
};
