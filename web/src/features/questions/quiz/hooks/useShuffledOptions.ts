import { useState, useEffect } from 'react';

import { Question } from '../../../../types/api';
import { getAvailableOptions } from '../../question-detail/utils/optionHelpers';
import { shuffleArray } from '../../../shared/shuffle';
import { ShuffledOption } from '../types';

interface UseShuffledOptionsReturn {
  shuffledOptions: ShuffledOption[];
  shuffledAnswer: string;
}

/**
 * Shuffles a question's options into a stable, randomized A/B/C/D order
 * whenever the question changes, tracking which relabeled key is correct.
 */
export const useShuffledOptions = (
  currentQuestion: Question,
): UseShuffledOptionsReturn => {
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledOption[]>([]);
  const [shuffledAnswer, setShuffledAnswer] = useState<string>('');

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    const opts = shuffleArray(
      getAvailableOptions(currentQuestion).map(option => ({
        originalKey: option.key,
        value: option.value,
      })),
    );

    const originalAnswer = currentQuestion.answer.toUpperCase();
    const labels = ['A', 'B', 'C', 'D'];
    let newAnswer = originalAnswer;
    const relabeled = opts.map((opt, idx) => {
      const newKey = labels[idx];
      if (opt.originalKey === originalAnswer) {
        newAnswer = newKey;
      }
      return { key: newKey, value: opt.value };
    });

    setShuffledOptions(relabeled);
    setShuffledAnswer(newAnswer);
  }, [currentQuestion]);

  return { shuffledOptions, shuffledAnswer };
};
