import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

import { Word, WordQuizResult, WordsRandomRequest } from '../../../types/api';
import {
  FamiliarityLevel,
  SearchOperation,
  SearchLogic,
} from '../../../types/base';
import { apiService } from '../../../lib/api';
import { PronunciationButton } from '../../../components/ui/PronunciationButton';
import {
  extractPronunciationUrls,
  isValidAudioUrl,
} from '../../shared/phonetics';

interface WordQuizProps {
  selectedFamiliarity: readonly FamiliarityLevel[];
  questionCount: number;
  onQuizComplete: (results: WordQuizResult[]) => void;
  onBackToHome: () => void;
  onError?: (message: string) => void;
}

type WordQuizState = 'loading' | 'quiz' | 'completed';

export const WordQuiz: React.FC<WordQuizProps> = ({
  selectedFamiliarity,
  questionCount,
  onQuizComplete,
  onBackToHome,
  onError,
}) => {
  const [state, setState] = useState<WordQuizState>('loading');
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [results, setResults] = useState<WordQuizResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const getFamiliarityBarColor = (familiarity: string) => {
    switch (familiarity.toLowerCase()) {
      case 'green':
        return 'bg-green-500 dark:bg-green-400';
      case 'yellow':
        return 'bg-yellow-500 dark:bg-yellow-400';
      case 'red':
        return 'bg-red-500 dark:bg-red-400';
      default:
        return 'bg-gray-400 dark:bg-gray-500';
    }
  };

  // Fetch random words for quiz
  useEffect(() => {
    const fetchQuizWords = async () => {
      try {
        setState('loading');
        setError(null);

        // Construct API request based on selected familiarities
        const allSelectedFamiliarity = selectedFamiliarity.filter(f =>
          [
            FamiliarityLevel.RED,
            FamiliarityLevel.YELLOW,
            FamiliarityLevel.GREEN,
          ].includes(f),
        );

        // Create a single request with all selected familiarity levels
        const request: WordsRandomRequest = {
          count: questionCount,
          filter: {
            conditions: [
              {
                key: 'familiarity',
                operator: SearchOperation.IN,
                value: JSON.stringify(allSelectedFamiliarity),
              },
            ],
            logic: SearchLogic.OR,
          },
        };

        // Fetch words for the quiz
        if (request.count <= 0) {
          setError('Invalid question count.');
          return;
        }

        const randomWords = await apiService.getRandomWords(request);
        setWords(randomWords);
        setState('quiz');
      } catch (error) {
        const errorMessage = 'Failed to load quiz words. Please try again.';
        setError(errorMessage);
        if (onError) {
          const detailedMessage =
            error instanceof Error ? error.message : 'Unknown error';
          onError('Failed to fetch quiz words: ' + detailedMessage);
        }
      }
    };

    fetchQuizWords();
  }, [selectedFamiliarity, questionCount, onError]);

  // Handle familiarity selection
  const handleFamiliaritySelect = async (newFamiliarity: FamiliarityLevel) => {
    const currentWord = words[currentWordIndex];

    try {
      // Update word familiarity via API
      await apiService.updateWordFields(currentWord.id, {
        word: currentWord.word,
        familiarity: newFamiliarity,
      });

      // Add to results
      const result: WordQuizResult = {
        word: currentWord,
        oldFamiliarity: currentWord.familiarity,
        newFamiliarity,
      };

      setResults(prev => [...prev, result]);

      // Move to next word or complete quiz
      if (currentWordIndex + 1 >= words.length) {
        const allResults = [...results, result];
        setState('completed');
        onQuizComplete(allResults);
      } else {
        setCurrentWordIndex(prev => prev + 1);
        setShowAnswer(false); // Reset to word display for next question
      }
    } catch (error) {
      const errorMessage = 'Failed to update word. Please try again.';
      setError(errorMessage);
      if (onError) {
        const detailedMessage =
          error instanceof Error ? error.message : 'Unknown error';
        onError('Failed to update word familiarity: ' + detailedMessage);
      }
    }
  };

  // Handle showing answer
  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const currentWord = words[currentWordIndex];
  const progress =
    words.length > 0 ? ((currentWordIndex + 1) / words.length) * 100 : 0;

  if (error) {
    return (
      <div className='mx-auto max-w-2xl py-12 text-center'>
        <div className='mb-4 text-6xl'>❌</div>
        <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
          Error
        </h3>
        <p className='mb-6 text-gray-600 dark:text-gray-300'>{error}</p>
        <button
          onClick={onBackToHome}
          className='rounded-md bg-primary-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600'
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className='mx-auto max-w-2xl py-12 text-center'>
        <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500'></div>
        <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
          Loading Quiz
        </h3>
        <p className='text-gray-600 dark:text-gray-300'>
          Preparing your quiz questions...
        </p>
      </div>
    );
  }

  if (state === 'quiz' && currentWord) {
    const pronunciationUrls = currentWord.definitions?.[0]?.phonetics
      ? extractPronunciationUrls(currentWord.definitions[0].phonetics)
      : { uk: null, us: null };

    return (
      <div className='flex h-full flex-col'>
        {/* Progress Bar */}
        <div className='mb-6 flex-shrink-0'>
          <div className='mb-2 flex justify-between text-sm text-gray-600 dark:text-gray-400'>
            <span>
              Question {currentWordIndex + 1} of {words.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
            <div
              className='h-2 rounded-full bg-primary-500 transition-all duration-300'
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {!showAnswer ? (
          // Stage 1: Word display only
          <>
            {/* Centered Word Display */}
            <div className='flex flex-1 flex-col items-center justify-center'>
              <h1 className='mb-6 break-all text-center text-4xl font-bold text-gray-900 dark:text-white md:text-4xl lg:text-8xl'>
                {currentWord.word}
              </h1>

              {/* Familiarity Bar */}
              {currentWord.familiarity && (
                <div className='mb-4 text-center'>
                  <div
                    className={`mx-auto h-2 w-64 rounded-full transition-colors duration-300 ${getFamiliarityBarColor(currentWord.familiarity)}`}
                  />
                </div>
              )}

              {/* Part of Speech */}
              <div className='my-3'>
                {Array.from(
                  new Set(
                    currentWord?.definitions
                      ?.map(def => def.part_of_speech)
                      ?.filter(Boolean),
                  ),
                ).map((pos, index) => (
                  <span
                    key={index}
                    className='mx-1 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  >
                    {pos}
                  </span>
                ))}
              </div>

              {/* Definition count */}
              {currentWord.definitions &&
                currentWord.definitions.length > 0 && (
                  <div className='mb-8 flex justify-between text-sm text-gray-700 dark:text-gray-300'>
                    Total {currentWord.definitions.length} definition
                    {currentWord.definitions.length > 1 ? 's' : ''}
                  </div>
                )}

              {/* Pronunciation buttons */}
              {(pronunciationUrls.uk || pronunciationUrls.us) && (
                <div className='flex items-center justify-center space-x-4'>
                  {pronunciationUrls.uk &&
                    isValidAudioUrl(pronunciationUrls.uk) && (
                      <PronunciationButton
                        audioUrl={pronunciationUrls.uk}
                        accent='uk'
                        size='md'
                      />
                    )}
                  {pronunciationUrls.us &&
                    isValidAudioUrl(pronunciationUrls.us) && (
                      <PronunciationButton
                        audioUrl={pronunciationUrls.us}
                        accent='us'
                        size='md'
                      />
                    )}
                </div>
              )}
            </div>

            {/* Bottom Action */}
            <div className='flex-shrink-0 text-center'>
              <button
                onClick={handleShowAnswer}
                className='w-full rounded-lg bg-blue-500 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              >
                Show Answer
              </button>
            </div>
          </>
        ) : (
          // Stage 2: Word details and familiarity selection
          <div className='flex-1 overflow-y-auto'>
            <div className='mx-auto max-w-2xl'>
              {/* Word Display */}
              <div className='mb-8 text-center'>
                <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-4xl lg:text-8xl'>
                  {currentWord.word}
                </h1>

                {/* Familiarity Bar */}
                {currentWord.familiarity && (
                  <div className='mb-4 text-center'>
                    <div
                      className={`mx-auto h-2 w-40 rounded-full transition-colors duration-300 ${getFamiliarityBarColor(currentWord.familiarity)}`}
                    />
                  </div>
                )}

                {/* Pronunciation buttons */}
                {(pronunciationUrls.uk || pronunciationUrls.us) && (
                  <div className='mb-6 flex items-center justify-center space-x-4'>
                    {pronunciationUrls.uk &&
                      isValidAudioUrl(pronunciationUrls.uk) && (
                        <PronunciationButton
                          audioUrl={pronunciationUrls.uk}
                          accent='uk'
                          size='md'
                        />
                      )}
                    {pronunciationUrls.us &&
                      isValidAudioUrl(pronunciationUrls.us) && (
                        <PronunciationButton
                          audioUrl={pronunciationUrls.us}
                          accent='us'
                          size='md'
                        />
                      )}
                  </div>
                )}
              </div>

              {/* Word Details (like WordDetailModal) */}
              {currentWord.definitions &&
                currentWord.definitions.length > 0 && (
                  <div className='mb-8 rounded-lg bg-gray-50 p-6 dark:bg-gray-700'>
                    <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
                      Definitions ({currentWord.definitions.length})
                    </h3>
                    <div className='space-y-4'>
                      {currentWord.definitions.map((definition, index) => (
                        <div key={definition.id} className='space-y-2'>
                          {definition.part_of_speech && (
                            <div className='flex-shrink-0'>
                              {definition.part_of_speech
                                .split(',')
                                .filter(pos => pos.trim())
                                .map((pos, posIndex) => (
                                  <span
                                    key={posIndex}
                                    className='mr-1 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  >
                                    {pos.trim()}
                                  </span>
                                ))}
                            </div>
                          )}

                          <div className='px-1'>
                            {/* Definitions */}
                            <div className='flex-1'>
                              <p className='text-gray-800 dark:text-gray-200'>
                                {definition.definition}
                              </p>
                            </div>

                            {/* Example */}
                            {definition.examples &&
                              definition.examples.length > 0 && (
                                <div className='mt-2'>
                                  <h5 className='mb-2 text-sm font-medium text-gray-600 dark:text-gray-400'>
                                    Examples:
                                  </h5>
                                  <ul className='space-y-1'>
                                    {definition.examples.map(
                                      (example, exampleIndex) => (
                                        <li
                                          key={exampleIndex}
                                          className='border-l-2 border-gray-300 pl-4 text-sm italic text-gray-600 dark:border-gray-600 dark:text-gray-400'
                                        >
                                          {example}
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}

                            {/* Notes */}
                            {definition.notes && (
                              <div className='mt-2'>
                                <h5 className='mb-1 text-sm font-medium text-gray-600 dark:text-gray-400'>
                                  Notes:
                                </h5>
                                <div className='prose prose-sm prose-slate max-w-none rounded bg-yellow-50 p-2 dark:prose-invert prose-headings:text-gray-800 prose-p:text-gray-600 prose-ul:text-gray-600 dark:bg-yellow-900/20 dark:prose-headings:text-gray-200 dark:prose-p:text-gray-400 dark:prose-ul:text-gray-400'>
                                  <div className='prose prose-sm prose-slate max-w-none rounded dark:prose-invert prose-p:text-gray-600 prose-code:rounded-md prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-pink-500 prose-code:before:content-none prose-code:after:content-none dark:prose-p:text-gray-400 dark:prose-code:bg-gray-800 dark:prose-code:text-pink-400'>
                                    <ReactMarkdown
                                      remarkPlugins={[remarkBreaks]}
                                    >
                                      {definition.notes.replace(/\\n/g, '\n')}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className='mb-6 text-center'>
                <p className='text-gray-600 dark:text-gray-400 lg:text-lg'>
                  How familiar are you with this word?
                </p>
              </div>

              {/* Familiarity Buttons */}
              <div className='mb-8 flex flex-col justify-center space-y-4'>
                <button
                  onClick={() => handleFamiliaritySelect(FamiliarityLevel.RED)}
                  className='flex min-w-[150px] flex-col items-center rounded-lg border-2 border-red-200 bg-red-50 p-4 transition-colors hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30'
                >
                  <div className='mb-2 h-6 w-6 rounded-full bg-red-500'></div>
                  <div className='text-center'>
                    <div className='text-xs text-red-600 dark:text-red-400'>
                      Unfamiliar
                    </div>
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleFamiliaritySelect(FamiliarityLevel.YELLOW)
                  }
                  className='flex min-w-[150px] flex-col items-center rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 transition-colors hover:bg-yellow-100 dark:border-yellow-700 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30'
                >
                  <div className='mb-2 h-6 w-6 rounded-full bg-yellow-500'></div>
                  <div className='text-center'>
                    <div className='text-xs text-yellow-600 dark:text-yellow-400'>
                      Somewhat Familiar
                    </div>
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleFamiliaritySelect(FamiliarityLevel.GREEN)
                  }
                  className='flex min-w-[150px] flex-col items-center rounded-lg border-2 border-green-200 bg-green-50 p-4 transition-colors hover:bg-green-100 dark:border-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30'
                >
                  <div className='mb-2 h-6 w-6 rounded-full bg-green-500'></div>
                  <div className='text-center'>
                    <div className='text-xs text-green-600 dark:text-green-400'>
                      Familiar
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // This should be handled by parent component, but fallback here
  return (
    <div className='mx-auto max-w-2xl py-12 text-center'>
      <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
        Quiz Completed
      </h3>
    </div>
  );
};
