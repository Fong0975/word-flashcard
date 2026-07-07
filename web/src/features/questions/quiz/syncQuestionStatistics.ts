import { QuestionQuizResult } from '../../../types/api';
import { apiService } from '../../../lib/api';
import { getApiErrorMessage } from '../../../lib/apiErrorMessage';

/**
 * Persists the updated practice/failure counts for each answered question.
 * Intended to be called without awaiting so it doesn't block quiz
 * completion; failures are reported via `onError` but otherwise swallowed.
 */
export const syncQuestionStatistics = async (
  results: QuestionQuizResult[],
  onError?: (message: string) => void,
): Promise<void> => {
  try {
    for (const result of results) {
      const question = result.question;
      await apiService.updateQuestion(question.id, {
        question: question.question,
        answer: question.answer,
        option_a: question.option_a,
        option_b: question.option_b || '',
        option_c: question.option_c || '',
        option_d: question.option_d || '',
        notes: question.notes,
        reference: question.reference,
        count_practise: result.updatedStats.countPractise,
        count_failure_practise: result.updatedStats.countFailurePractise,
      });
    }
  } catch (error) {
    if (onError) {
      const errorMessage = getApiErrorMessage(error);
      onError('Failed to update question statistics: ' + errorMessage);
    }
    // Don't block the quiz completion on statistics update failure
  }
};
