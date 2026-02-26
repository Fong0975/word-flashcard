import { Question } from '../../../../types/api';

export const formatQuestionForCopy = (question: Question): string => {
  if (!question) return '';

  let content = `${question.question}\n`;
  content += `A. ${question.option_a}\n`;
  if (question.option_b) content += `B. ${question.option_b}\n`;
  if (question.option_c) content += `C. ${question.option_c}\n`;
  if (question.option_d) content += `D. ${question.option_d}\n`;

  return content.trim();
};

export const formatPracticeText = (practiceCount: number): string => {
  if (practiceCount === 0) return 'Not practiced yet';
  return `Practiced ${practiceCount} time${practiceCount !== 1 ? 's' : ''}`;
};