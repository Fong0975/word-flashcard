import { Question } from '../../../../types/api';
import { QuestionFormData } from '../../question-form/types/question-form';

import {
  formatQuestionForCopy,
  formatFormDataForCopy,
  formatPracticeText,
} from './questionFormat';

const buildQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 1,
  question: 'What is 2 + 2?',
  answer: 'A',
  option_a: '4',
  option_b: '3',
  option_c: '5',
  option_d: '6',
  count_failure_practise: 0,
  count_practise: 0,
  notes: '',
  reference: '',
  ...overrides,
});

const buildFormData = (
  overrides: Partial<QuestionFormData> = {},
): QuestionFormData => ({
  question: 'What is 2 + 2?',
  answer: 'A',
  options: { A: '4', B: '3', C: '5', D: '6' },
  notes: '',
  reference: '',
  ...overrides,
});

describe('formatQuestionForCopy', () => {
  it('formats a question with all options', () => {
    expect(formatQuestionForCopy(buildQuestion())).toBe(
      'What is 2 + 2?\nA. 4\nB. 3\nC. 5\nD. 6',
    );
  });

  it('omits options that are absent', () => {
    const question = buildQuestion({
      option_c: undefined,
      option_d: undefined,
    });
    expect(formatQuestionForCopy(question)).toBe('What is 2 + 2?\nA. 4\nB. 3');
  });

  it('returns an empty string for a falsy question', () => {
    expect(formatQuestionForCopy(null as unknown as Question)).toBe('');
  });
});

describe('formatFormDataForCopy', () => {
  it('formats form data with all options', () => {
    expect(formatFormDataForCopy(buildFormData())).toBe(
      'What is 2 + 2?\nA. 4\nB. 3\nC. 5\nD. 6',
    );
  });

  it('omits options that are empty strings', () => {
    const formData = buildFormData();
    formData.options.C = '';
    formData.options.D = '';
    expect(formatFormDataForCopy(formData)).toBe('What is 2 + 2?\nA. 4\nB. 3');
  });

  it('returns an empty string for falsy form data', () => {
    expect(formatFormDataForCopy(null as unknown as QuestionFormData)).toBe('');
  });
});

describe('formatPracticeText', () => {
  it('reports not practiced yet when count is 0', () => {
    expect(formatPracticeText(0)).toBe('Not practiced yet');
  });

  it('uses singular phrasing for exactly one practice', () => {
    expect(formatPracticeText(1)).toBe('Practiced 1 time');
  });

  it('uses plural phrasing for more than one practice', () => {
    expect(formatPracticeText(5)).toBe('Practiced 5 times');
  });
});
