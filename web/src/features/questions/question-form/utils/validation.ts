import { AnswerOption, QuestionFormData } from '../types';

export const validateQuestionForm = (
  formData: QuestionFormData,
): string | null => {
  if (!formData.question.trim()) {
    return 'Please enter a question';
  }

  if (!formData.answer.trim()) {
    return 'Please select an answer';
  }

  if (!formData.options.A.trim()) {
    return 'Please enter option A';
  }

  if (!formData.options[formData.answer as AnswerOption]?.trim()) {
    return 'The correct answer option must have text';
  }

  return null; // No errors
};
