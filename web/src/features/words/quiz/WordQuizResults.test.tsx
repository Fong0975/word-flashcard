import { render, screen } from '@testing-library/react';

import { Word, WordQuizResult } from '../../../types/api';
import { FamiliarityLevel } from '../../../types/base';
import { FAMILIARITY_LABELS } from '../../shared/constants/familiarity';

import { WordQuizResults } from './WordQuizResults';

const RED_LABEL = FAMILIARITY_LABELS[FamiliarityLevel.RED];
const YELLOW_LABEL = FAMILIARITY_LABELS[FamiliarityLevel.YELLOW];
const GREEN_LABEL = FAMILIARITY_LABELS[FamiliarityLevel.GREEN];

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.GREEN,
  reminder: null,
  count_practise: 0,
  definitions: [],
  ...overrides,
});

const buildResult = (
  overrides: Partial<WordQuizResult> = {},
): WordQuizResult => ({
  word: buildWord(),
  oldFamiliarity: FamiliarityLevel.RED,
  newFamiliarity: FamiliarityLevel.YELLOW,
  ...overrides,
});

describe('WordQuizResults', () => {
  it('renders the total question count', () => {
    render(
      <WordQuizResults
        results={[
          buildResult({ word: buildWord({ id: 1 }) }),
          buildResult({ word: buildWord({ id: 2 }) }),
          buildResult({ word: buildWord({ id: 3 }) }),
        ]}
      />,
    );

    expect(screen.getByText('Quiz Results (3 words)')).toBeInTheDocument();
  });

  it('tallies the familiarity distribution and change counts', () => {
    const results: WordQuizResult[] = [
      // red -> yellow: improvement, counts toward "yellow"
      buildResult({
        word: buildWord({ id: 1, word: 'apple' }),
        oldFamiliarity: FamiliarityLevel.RED,
        newFamiliarity: FamiliarityLevel.YELLOW,
      }),
      // yellow -> green: improvement, counts toward "green"
      buildResult({
        word: buildWord({ id: 2, word: 'banana' }),
        oldFamiliarity: FamiliarityLevel.YELLOW,
        newFamiliarity: FamiliarityLevel.GREEN,
      }),
      // green -> red: worsened, counts toward "red"
      buildResult({
        word: buildWord({ id: 3, word: 'cherry' }),
        oldFamiliarity: FamiliarityLevel.GREEN,
        newFamiliarity: FamiliarityLevel.RED,
      }),
    ];

    render(<WordQuizResults results={results} />);

    // Each count carries its own aria-label, so they can be targeted
    // directly regardless of whether two categories share the same value.
    expect(screen.getByLabelText(`${RED_LABEL} count`)).toHaveTextContent('1');
    expect(screen.getByLabelText(`${YELLOW_LABEL} count`)).toHaveTextContent(
      '1',
    );
    expect(screen.getByLabelText(`${GREEN_LABEL} count`)).toHaveTextContent(
      '1',
    );
    expect(screen.getByLabelText('improvement count')).toHaveTextContent('2');
    expect(screen.getByLabelText('stay count')).toHaveTextContent('0');
    expect(screen.getByLabelText('worsened count')).toHaveTextContent('1');
  });

  // A single red -> yellow result: one improvement that lands in "yellow".
  it.each([
    [`${RED_LABEL}: 0 words`, `${RED_LABEL} count`],
    [`${YELLOW_LABEL}: 1 word`, `${YELLOW_LABEL} count`],
    [`${GREEN_LABEL}: 0 words`, `${GREEN_LABEL} count`],
    ['Improved: 1 word', 'improvement count'],
    ['Unchanged: 0 words', 'stay count'],
    ['Worsened: 0 words', 'worsened count'],
  ])('explains a summary block with the tooltip "%s"', (title, countLabel) => {
    render(<WordQuizResults results={[buildResult()]} />);

    expect(screen.getByTitle(title)).toContainElement(
      screen.getByLabelText(countLabel),
    );
  });

  it.each([
    [FamiliarityLevel.RED, FamiliarityLevel.YELLOW],
    [FamiliarityLevel.YELLOW, FamiliarityLevel.GREEN],
    [FamiliarityLevel.GREEN, FamiliarityLevel.RED],
  ])(
    'labels a %s -> %s change with the familiarity labels',
    (oldFamiliarity, newFamiliarity) => {
      render(
        <WordQuizResults
          results={[buildResult({ oldFamiliarity, newFamiliarity })]}
        />,
      );

      expect(
        screen.getByText(FAMILIARITY_LABELS[oldFamiliarity]),
      ).toBeInTheDocument();
      expect(
        screen.getByText(FAMILIARITY_LABELS[newFamiliarity]),
      ).toBeInTheDocument();
    },
  );

  it("renders each result's word name and first definition", () => {
    const results: WordQuizResult[] = [
      buildResult({
        word: buildWord({
          id: 1,
          word: 'apple',
          definitions: [
            {
              id: 1,
              definition: 'A round fruit',
              examples: [],
              notes: '',
              part_of_speech: 'noun',
              phonetics: {},
            },
          ],
        }),
      }),
    ];

    render(<WordQuizResults results={results} />);

    expect(screen.getByText('apple')).toBeInTheDocument();
    expect(screen.getByText('A round fruit')).toBeInTheDocument();
  });

  it('renders without a definition line when there are none', () => {
    render(
      <WordQuizResults
        results={[buildResult({ word: buildWord({ definitions: [] }) })]}
      />,
    );

    expect(screen.getByText('apple')).toBeInTheDocument();
  });

  it('renders gracefully with an empty results list', () => {
    render(<WordQuizResults results={[]} />);

    expect(screen.getByText('Quiz Results (0 words)')).toBeInTheDocument();
  });
});
