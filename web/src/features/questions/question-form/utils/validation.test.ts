import { QuestionFormData } from '../types';

import { validateQuestionForm } from './validation';

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

describe('validateQuestionForm', () => {
  it('returns null when all required fields are filled', () => {
    expect(validateQuestionForm(buildFormData())).toBeNull();
  });

  it('rejects an empty question', () => {
    expect(validateQuestionForm(buildFormData({ question: '' }))).toBe(
      'Please enter a question',
    );
  });

  it('rejects a whitespace-only question', () => {
    expect(validateQuestionForm(buildFormData({ question: '   ' }))).toBe(
      'Please enter a question',
    );
  });

  it('rejects an empty answer', () => {
    expect(validateQuestionForm(buildFormData({ answer: '' }))).toBe(
      'Please select an answer',
    );
  });

  it('rejects an empty option A', () => {
    const formData = buildFormData();
    formData.options.A = '';
    expect(validateQuestionForm(formData)).toBe('Please enter option A');
  });

  it('does not require options B, C, or D', () => {
    const formData = buildFormData();
    formData.options.B = '';
    formData.options.C = '';
    formData.options.D = '';
    expect(validateQuestionForm(formData)).toBeNull();
  });

  it('checks question before answer before option A', () => {
    expect(
      validateQuestionForm(buildFormData({ question: '', answer: '' })),
    ).toBe('Please enter a question');
  });
});
