import { Question } from '../../../../types/api';
import { QuestionOption } from '../types/question-detail';

export const getAvailableOptions = (question: Question): QuestionOption[] => {
  const options: QuestionOption[] = [];

  if (question.option_a) {
    options.push({ key: 'A', value: question.option_a });
  }
  if (question.option_b) {
    options.push({ key: 'B', value: question.option_b });
  }
  if (question.option_c) {
    options.push({ key: 'C', value: question.option_c });
  }
  if (question.option_d) {
    options.push({ key: 'D', value: question.option_d });
  }

  return options;
};
