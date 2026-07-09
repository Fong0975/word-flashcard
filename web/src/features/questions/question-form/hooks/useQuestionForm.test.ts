import { renderHook, act } from '@testing-library/react';

import { Question } from '../../../../types/api';

import { useQuestionForm } from './useQuestionForm';

const blankForm = {
  question: '',
  answer: '',
  options: { A: '', B: '', C: '', D: '' },
  notes: '',
  reference: '',
};

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
  notes: 'some notes',
  reference: 'some reference',
  ...overrides,
});

describe('useQuestionForm', () => {
  it('starts blank in create mode', () => {
    const { result } = renderHook(() =>
      useQuestionForm({ mode: 'create', isOpen: true }),
    );
    expect(result.current.formData).toEqual(blankForm);
    expect(result.current.isValid).toBe(false);
  });

  it('populates the form from the question in edit mode', () => {
    const question = buildQuestion();
    const { result } = renderHook(() =>
      useQuestionForm({ mode: 'edit', question, isOpen: true }),
    );

    expect(result.current.formData).toEqual({
      question: 'What is 2 + 2?',
      answer: 'A',
      options: { A: '4', B: '3', C: '5', D: '6' },
      notes: 'some notes',
      reference: 'some reference',
    });
    expect(result.current.isValid).toBe(true);
  });

  it('falls back to empty strings for missing options in edit mode', () => {
    const question = buildQuestion({
      option_b: undefined,
      option_c: undefined,
      option_d: undefined,
    });
    const { result } = renderHook(() =>
      useQuestionForm({ mode: 'edit', question, isOpen: true }),
    );

    expect(result.current.formData.options).toEqual({
      A: '4',
      B: '',
      C: '',
      D: '',
    });
  });

  it('updates individual fields via the handlers', () => {
    const { result } = renderHook(() =>
      useQuestionForm({ mode: 'create', isOpen: true }),
    );

    act(() => {
      result.current.handlers.handleQuestionChange('New question?');
      result.current.handlers.handleAnswerChange('B');
      result.current.handlers.handleOptionChange('B', 'Option B');
      result.current.handlers.handleNotesChange('Some notes');
      result.current.handlers.handleReferenceChange('Some reference');
    });

    expect(result.current.formData).toEqual({
      question: 'New question?',
      answer: 'B',
      options: { A: '', B: 'Option B', C: '', D: '' },
      notes: 'Some notes',
      reference: 'Some reference',
    });
  });

  it('appends template text to notes with a newline separator', () => {
    const { result } = renderHook(() =>
      useQuestionForm({ mode: 'create', isOpen: true }),
    );

    act(() => {
      result.current.handlers.handleNotesChange('Line 1');
      result.current.handlers.appendToNotes('Line 2');
    });

    expect(result.current.formData.notes).toBe('Line 1\nLine 2');
  });

  it('replaces the reference field from a template', () => {
    const { result } = renderHook(() =>
      useQuestionForm({ mode: 'create', isOpen: true }),
    );

    act(() => {
      result.current.handlers.handleReferenceChange('old');
      result.current.handlers.setReferenceFromTemplate('template text');
    });

    expect(result.current.formData.reference).toBe('template text');
  });

  it('resetForm clears the form back to blank', () => {
    const { result } = renderHook(() =>
      useQuestionForm({ mode: 'create', isOpen: true }),
    );

    act(() => {
      result.current.handlers.handleQuestionChange('Something');
    });
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData).toEqual(blankForm);
  });

  it('exposes the validation error for an incomplete form', () => {
    const { result } = renderHook(() =>
      useQuestionForm({ mode: 'create', isOpen: true }),
    );

    expect(result.current.validationError).toBe('Please enter a question');
    expect(result.current.isValid).toBe(false);
  });
});
