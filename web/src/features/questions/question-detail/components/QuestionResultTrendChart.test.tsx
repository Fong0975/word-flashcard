import { render } from '@testing-library/react';

import { QuestionAnswerLogEntry } from '../../../../types/api';

import {
  ANSWER_RESULT_COLORS,
  ResultDot,
  buildResultTrendData,
} from './QuestionResultTrendChart';

const buildEntry = (
  overrides: Partial<QuestionAnswerLogEntry> = {},
): QuestionAnswerLogEntry => ({
  id: 1,
  selected_option: 'B',
  is_correct: true,
  created_at: '2026-07-10T10:00:00Z',
  ...overrides,
});

describe('buildResultTrendData', () => {
  it.each([
    {
      name: 'returns no points when there is no history',
      entries: [],
      expected: [],
    },
    {
      name: 'maps a correct answer to 1 without a starting point',
      entries: [buildEntry({ is_correct: true })],
      expected: [{ index: 0, result: 1, created_at: '2026-07-10T10:00:00Z' }],
    },
    {
      name: 'maps an incorrect answer to 0',
      entries: [buildEntry({ is_correct: false })],
      expected: [{ index: 0, result: 0, created_at: '2026-07-10T10:00:00Z' }],
    },
    {
      name: 'orders newest-first entries chronologically',
      entries: [
        buildEntry({
          id: 2,
          is_correct: true,
          created_at: '2026-07-11T10:00:00Z',
        }),
        buildEntry({
          id: 1,
          is_correct: false,
          created_at: '2026-07-10T10:00:00Z',
        }),
      ],
      expected: [
        { index: 0, result: 0, created_at: '2026-07-10T10:00:00Z' },
        { index: 1, result: 1, created_at: '2026-07-11T10:00:00Z' },
      ],
    },
  ])('$name', ({ entries, expected }) => {
    expect(buildResultTrendData(entries)).toEqual(expected);
  });
});

describe('ResultDot', () => {
  it.each([
    {
      name: 'fills a correct answer green',
      props: { cx: 10, cy: 20, payload: { result: 1 } },
      expected: { fill: ANSWER_RESULT_COLORS.correct, r: '4' },
    },
    {
      name: 'fills an incorrect answer red',
      props: { cx: 10, cy: 20, payload: { result: 0 } },
      expected: { fill: ANSWER_RESULT_COLORS.incorrect, r: '4' },
    },
    {
      name: 'uses the given radius',
      props: { cx: 10, cy: 20, payload: { result: 1 }, radius: 6 },
      expected: { fill: ANSWER_RESULT_COLORS.correct, r: '6' },
    },
    {
      name: 'renders nothing without a position',
      props: { payload: { result: 1 } },
      expected: null,
    },
    {
      name: 'renders nothing without a payload',
      props: { cx: 10, cy: 20 },
      expected: null,
    },
  ])('$name', ({ props, expected }) => {
    const { container } = render(
      <svg>
        <ResultDot {...props} />
      </svg>,
    );

    const circle = container.querySelector('circle');
    if (expected === null) {
      expect(circle).toBeNull();
      return;
    }
    expect(circle).toHaveAttribute('cx', '10');
    expect(circle).toHaveAttribute('cy', '20');
    expect(circle).toHaveAttribute('fill', expected.fill);
    expect(circle).toHaveAttribute('r', expected.r);
  });
});
