import { Question } from '../../../../types/api';
import { QuestionFormData } from '../../question-form/types/question-form';

export const formatQuestionForCopy = (question: Question): string => {
  if (!question) {
    return '';
  }

  let content = `${question.question}\n`;
  content += `A. ${question.option_a}\n`;
  if (question.option_b) {
    content += `B. ${question.option_b}\n`;
  }
  if (question.option_c) {
    content += `C. ${question.option_c}\n`;
  }
  if (question.option_d) {
    content += `D. ${question.option_d}\n`;
  }

  return content.trim();
};

export const formatFormDataForCopy = (formData: QuestionFormData): string => {
  if (!formData) {
    return '';
  }

  let content = `${formData.question || ''}\n`;
  content += `A. ${formData.options.A || ''}\n`;
  if (formData.options.B) {
    content += `B. ${formData.options.B}\n`;
  }
  if (formData.options.C) {
    content += `C. ${formData.options.C}\n`;
  }
  if (formData.options.D) {
    content += `D. ${formData.options.D}\n`;
  }

  return content.trim();
};

export const formatPracticeText = (practiceCount: number): string => {
  if (practiceCount === 0) {
    return 'Not practiced yet';
  }
  return `Practiced ${practiceCount} time${practiceCount !== 1 ? 's' : ''}`;
};
