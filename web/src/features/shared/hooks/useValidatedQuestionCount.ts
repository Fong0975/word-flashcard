import { useState } from 'react';

interface UseValidatedQuestionCountReturn {
  questionCount: number;
  questionCountInput: string;
  questionCountError: string;
  handleQuestionCountChange: (value: string) => void;
  setQuestionCountInput: (value: string) => void;
  reset: () => void;
}

/**
 * Tracks a question-count field as both a validated number and its raw text
 * input, so an in-progress edit (e.g. an empty string) doesn't have to be a
 * valid number yet.
 */
export const useValidatedQuestionCount = (
  defaultCount: number,
  min: number,
  max: number,
): UseValidatedQuestionCountReturn => {
  const [questionCount, setQuestionCount] = useState<number>(defaultCount);
  const [questionCountInput, setQuestionCountInput] = useState<string>(
    defaultCount.toString(),
  );
  const [questionCountError, setQuestionCountError] = useState<string>('');

  const handleQuestionCountChange = (value: string) => {
    setQuestionCountInput(value);
    setQuestionCountError('');

    if (!value.trim()) {
      setQuestionCountError('Please enter a number of questions.');
      setQuestionCount(0);
      return;
    }

    const numValue = parseInt(value, 10);

    if (isNaN(numValue)) {
      setQuestionCountError('Please enter a valid number.');
      setQuestionCount(0);
      return;
    }

    if (numValue < min) {
      setQuestionCountError(`Number of questions must be at least ${min}.`);
      setQuestionCount(numValue);
      return;
    }

    if (numValue > max) {
      setQuestionCountError(`Number of questions cannot exceed ${max}.`);
      setQuestionCount(numValue);
      return;
    }

    setQuestionCount(numValue);
  };

  const reset = () => {
    setQuestionCount(defaultCount);
    setQuestionCountInput(defaultCount.toString());
    setQuestionCountError('');
  };

  return {
    questionCount,
    questionCountInput,
    questionCountError,
    handleQuestionCountChange,
    setQuestionCountInput,
    reset,
  };
};
