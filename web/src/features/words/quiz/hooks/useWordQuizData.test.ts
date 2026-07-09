import { renderHook, waitFor } from '@testing-library/react';

import { Word } from '../../../../types/api';
import {
  FamiliarityLevel,
  SearchOperation,
  SearchLogic,
} from '../../../../types/base';
import { apiService } from '../../../../lib/api';

import { useWordQuizData } from './useWordQuizData';

const buildWord = (id: number): Word => ({
  id,
  word: `word-${id}`,
  familiarity: FamiliarityLevel.YELLOW,
  reminder: null,
  count_practise: 0,
  definitions: [],
});

describe('useWordQuizData', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('standard mode (total count with familiarity filter)', () => {
    it('requests the given count filtered by the selected familiarity levels', async () => {
      const getRandomWordsSpy = jest
        .spyOn(apiService, 'getRandomWords')
        .mockResolvedValue([buildWord(1)]);
      // Declared outside the renderHook callback so the reference stays
      // stable across the re-renders the hook's own setState calls trigger.
      // An inline array literal here would be recreated on every one of
      // those re-renders, which the effect's dependency array would see as
      // "changed", causing it to re-run and refetch repeatedly.
      const selectedFamiliarity = [
        FamiliarityLevel.RED,
        FamiliarityLevel.GREEN,
      ];

      renderHook(() =>
        useWordQuizData({ selectedFamiliarity, questionCount: 10 }),
      );

      await waitFor(() =>
        expect(getRandomWordsSpy).toHaveBeenCalledWith({
          count: 10,
          filter: {
            conditions: [
              {
                key: 'familiarity',
                operator: SearchOperation.IN,
                value: JSON.stringify([
                  FamiliarityLevel.RED,
                  FamiliarityLevel.GREEN,
                ]),
              },
            ],
            logic: SearchLogic.OR,
          },
        }),
      );
    });

    it('transitions to the quiz state with the fetched words', async () => {
      const words = [buildWord(1), buildWord(2)];
      jest.spyOn(apiService, 'getRandomWords').mockResolvedValue(words);
      const selectedFamiliarity = [FamiliarityLevel.RED];

      const { result } = renderHook(() =>
        useWordQuizData({ selectedFamiliarity, questionCount: 10 }),
      );

      await waitFor(() => expect(result.current.state).toBe('quiz'));
      expect(result.current.words).toEqual(words);
    });

    it('sets an error without calling the API for a non-positive count', async () => {
      const getRandomWordsSpy = jest.spyOn(apiService, 'getRandomWords');
      const selectedFamiliarity = [FamiliarityLevel.RED];

      const { result } = renderHook(() =>
        useWordQuizData({ selectedFamiliarity, questionCount: 0 }),
      );

      await waitFor(() =>
        expect(result.current.error).toBe('Invalid question count.'),
      );
      expect(getRandomWordsSpy).not.toHaveBeenCalled();
    });

    it('sets an error and stays out of the quiz state when no words are returned', async () => {
      jest.spyOn(apiService, 'getRandomWords').mockResolvedValue([]);
      const selectedFamiliarity = [FamiliarityLevel.RED];

      const { result } = renderHook(() =>
        useWordQuizData({ selectedFamiliarity, questionCount: 10 }),
      );

      await waitFor(() =>
        expect(result.current.error).toBe(
          'No questions available for quiz. Please add some questions first.',
        ),
      );
      expect(result.current.state).toBe('loading');
    });

    it('sets an error and calls onError when the fetch fails', async () => {
      jest
        .spyOn(apiService, 'getRandomWords')
        .mockRejectedValue(new Error('network down'));
      const onError = jest.fn();
      const selectedFamiliarity = [FamiliarityLevel.RED];

      const { result } = renderHook(() =>
        useWordQuizData({ selectedFamiliarity, questionCount: 10, onError }),
      );

      await waitFor(() => expect(result.current.error).toBe('network down'));
      expect(onError).toHaveBeenCalledWith(
        'Failed to fetch quiz words: network down',
      );
    });
  });

  describe('per-category mode', () => {
    it('issues one request per category with a positive count', async () => {
      const getRandomWordsSpy = jest
        .spyOn(apiService, 'getRandomWords')
        .mockResolvedValue([buildWord(1)]);
      const selectedFamiliarity: FamiliarityLevel[] = [];
      const perCategoryCounts = { red: 3, yellow: 0, green: 2 };

      renderHook(() =>
        useWordQuizData({
          selectedFamiliarity,
          questionCount: 0,
          perCategoryCounts,
        }),
      );

      await waitFor(() => expect(getRandomWordsSpy).toHaveBeenCalledTimes(2));
      expect(getRandomWordsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ count: 3 }),
      );
      expect(getRandomWordsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ count: 2 }),
      );
    });

    it('combines the results from every category', async () => {
      const redWords = [buildWord(1)];
      const greenWords = [buildWord(2), buildWord(3)];
      jest
        .spyOn(apiService, 'getRandomWords')
        .mockResolvedValueOnce(redWords)
        .mockResolvedValueOnce(greenWords);
      const selectedFamiliarity: FamiliarityLevel[] = [];
      const perCategoryCounts = { red: 1, yellow: 0, green: 2 };

      const { result } = renderHook(() =>
        useWordQuizData({
          selectedFamiliarity,
          questionCount: 0,
          perCategoryCounts,
        }),
      );

      await waitFor(() => expect(result.current.state).toBe('quiz'));
      expect(result.current.words.map(w => w.id).sort()).toEqual([1, 2, 3]);
    });

    it('sets an error when every category is empty', async () => {
      const selectedFamiliarity: FamiliarityLevel[] = [];
      const perCategoryCounts = { red: 0, yellow: 0, green: 0 };

      const { result } = renderHook(() =>
        useWordQuizData({
          selectedFamiliarity,
          questionCount: 0,
          perCategoryCounts,
        }),
      );

      await waitFor(() =>
        expect(result.current.error).toBe(
          'No questions available for quiz. Please add some questions first.',
        ),
      );
    });
  });
});
