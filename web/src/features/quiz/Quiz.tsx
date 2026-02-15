import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Word, QuizResult, WordsRandomRequest } from '../../types/api';
import { apiService } from '../../lib/api';
import { PronunciationButton } from '../../components/ui/PronunciationButton';
import { extractPronunciationUrls, isValidAudioUrl } from '../shared/phonetics';

interface QuizProps {
  selectedFamiliarity: string[];
  questionCount: number;
  onQuizComplete: (results: QuizResult[]) => void;
  onBackToHome: () => void;
}

type QuizState = 'loading' | 'quiz' | 'completed';

export const Quiz: React.FC<QuizProps> = ({
  selectedFamiliarity,
  questionCount,
  onQuizComplete,
  onBackToHome
}) => {
  const [state, setState] = useState<QuizState>('loading');
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
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

        // Count for 'red', 'yellow', 'green' shoud be 2:3:5
        let countRed = 0, countYellow = 0, countGreen = 0;

        let remaining = questionCount;
        const existGreen = selectedFamiliarity.includes('green');
        const existYellow = selectedFamiliarity.includes('yellow');
        const existRed = selectedFamiliarity.includes('red');
        if (existGreen) {
          const maxGreen = Math.floor(remaining * 0.2);
          countGreen = Math.floor(Math.random() * (maxGreen + 1));
          remaining -= countGreen;
        }

        if (existYellow) {
          const maxYellow = Math.floor(remaining * 0.3);
          countYellow = Math.floor(Math.random() * (maxYellow + 1));
          remaining -= countYellow;
        }

        if (existRed) {
          countRed = remaining;
          remaining = 0;
        } else {
          // If there is no red but there are remaining quantities, distribute them evenly among the existing colors
          if (selectedFamiliarity.length > 0) {
            if (existGreen && existYellow) {
              // Distribute remaining between green and yellow
              const maxGreen = Math.floor(remaining * 0.4);
              countGreen += Math.floor(Math.random() * (maxGreen + 1));
              countYellow += (remaining - countGreen);
            } else if (existGreen) {
              countGreen += remaining;
            } else if (existYellow) {
              countYellow += remaining;
            }
          }
        }

        console.log('Quiz word counts:', { countRed, countYellow, countGreen });

        // Construct API request based on selected familiarities
        const requests: WordsRandomRequest[] = [];
        if (existRed) {
          requests.push({
            count: countRed,
            filter: {
              key: 'familiarity',
              operator: 'eq',
              value: 'red',
            },
          });
        }
        if (existYellow) {
          requests.push({
            count: countYellow,
            filter: {
              key: 'familiarity',
              operator: 'eq',
              value: 'yellow',
            },
          });
        }
        if (existGreen) {
          requests.push({
            count: countGreen,
            filter: {
              key: 'familiarity',
              operator: 'eq',
              value: 'green',
            },
          });
        }

        // Fetch words for each familiarity level and combine results
        const allWords: Word[] = [];
        for (const req of requests) {
          if (req.count <= 0) continue; // Skip if count is zero or negative

          const randomWords = await apiService.getRandomWords(req);
          allWords.push(...randomWords);
        }

        setWords(allWords);
        setState('quiz');
      } catch (error) {
        console.error('Failed to fetch quiz words:', error);
        setError('Failed to load quiz words. Please try again.');
      }
    };

    fetchQuizWords();
  }, [selectedFamiliarity, questionCount]);

  // Handle familiarity selection
  const handleFamiliaritySelect = async (newFamiliarity: string) => {
    const currentWord = words[currentWordIndex];

    try {
      // Update word familiarity via API
      await apiService.updateWordFields(currentWord.id, {
        word: currentWord.word,
        familiarity: newFamiliarity,
      });

      // Add to results
      const result: QuizResult = {
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
      console.error('Failed to update word familiarity:', error);
      setError('Failed to update word. Please try again.');
    }
  };

  // Handle showing answer
  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const currentWord = words[currentWordIndex];
  const progress = words.length > 0 ? ((currentWordIndex + 1) / words.length) * 100 : 0;

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Error
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {error}
        </p>
        <button
          onClick={onBackToHome}
          className="px-6 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600
                     rounded-md transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Loading Quiz
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
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
      <div className="h-full flex flex-col">
        {/* Progress Bar */}
        <div className="flex-shrink-0 mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Question {currentWordIndex + 1} of {words.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {!showAnswer ? (
          // Stage 1: Word display only
          <>
            {/* Centered Word Display */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <h1 className="text-8xl font-bold text-gray-900 dark:text-white mb-6">
                {currentWord.word}
              </h1>

              {/* Familiarity Bar */}
              {currentWord.familiarity && (
                <div className="text-center mb-4">
                  <div className={`w-64 h-2 rounded-full transition-colors duration-300 mx-auto ${getFamiliarityBarColor(currentWord.familiarity)}`} />
                </div>
              )}

              {/* Part of Speech */}
              <div className='mt-3 mb-6'>
                {Array.from(
                  new Set(
                    currentWord?.definitions
                      ?.map((def) => def.part_of_speech)
                      ?.filter(Boolean)
                  )
                ).map((pos, index) => (
                  <span key={index}
                    className="inline-block px-2 py-1 mx-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    {pos}
                  </span>
                ))}
              </div>

              {/* Pronunciation buttons */}
              {(pronunciationUrls.uk || pronunciationUrls.us) && (
                <div className="flex items-center justify-center space-x-4">
                  {pronunciationUrls.uk && isValidAudioUrl(pronunciationUrls.uk) && (
                    <PronunciationButton
                      audioUrl={pronunciationUrls.uk}
                      accent="uk"
                      size="md"
                    />
                  )}
                  {pronunciationUrls.us && isValidAudioUrl(pronunciationUrls.us) && (
                    <PronunciationButton
                      audioUrl={pronunciationUrls.us}
                      accent="us"
                      size="md"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Bottom Action */}
            <div className="flex-shrink-0 text-center">
              <button
                onClick={handleShowAnswer}
                className="px-8 py-3 text-lg font-medium text-white bg-blue-500 hover:bg-blue-600
                           rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Show Answer
              </button>
            </div>
          </>
        ) : (
          // Stage 2: Word details and familiarity selection
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              {/* Word Display */}
              <div className="text-center mb-8">
                <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
                  {currentWord.word}
                </h1>

                {/* Familiarity Bar */}
                {currentWord.familiarity && (
                  <div className="text-center mb-4">
                    <div className={`w-40 h-2 rounded-full transition-colors duration-300 mx-auto ${getFamiliarityBarColor(currentWord.familiarity)}`} />
                  </div>
                )}

                {/* Pronunciation buttons */}
                {(pronunciationUrls.uk || pronunciationUrls.us) && (
                  <div className="flex items-center justify-center space-x-4 mb-6">
                    {pronunciationUrls.uk && isValidAudioUrl(pronunciationUrls.uk) && (
                      <PronunciationButton
                        audioUrl={pronunciationUrls.uk}
                        accent="uk"
                        size="md"
                      />
                    )}
                    {pronunciationUrls.us && isValidAudioUrl(pronunciationUrls.us) && (
                      <PronunciationButton
                        audioUrl={pronunciationUrls.us}
                        accent="us"
                        size="md"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Word Details (like WordDetailModal) */}
              {currentWord.definitions && currentWord.definitions.length > 0 && (
                <div className="mb-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Definitions ({currentWord.definitions.length})
                  </h3>
                  <div className="space-y-4">
                    {currentWord.definitions.map((definition, index) => (
                      <div key={definition.id} className="space-y-2">
                        <div className="flex items-start space-x-3">
                          {definition.part_of_speech && (
                            <div className="flex-shrink-0">
                              {definition.part_of_speech
                                .split(',')
                                .filter(pos => pos.trim())
                                .map((pos, posIndex) => (
                                  <span
                                    key={posIndex}
                                    className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full mr-1"
                                  >
                                    {pos.trim()}
                                  </span>
                                ))
                              }
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-gray-800 dark:text-gray-200">
                              {definition.definition}
                            </p>
                          </div>
                        </div>

                        {definition.examples && definition.examples.length > 0 && (
                          <div className="ml-6">
                            <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                              Examples:
                            </h5>
                            <ul className="space-y-1">
                              {definition.examples.map((example, exampleIndex) => (
                                <li key={exampleIndex} className="text-sm text-gray-600 dark:text-gray-400 italic pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                                  {example}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {definition.notes && (
                          <div className="ml-6">
                            <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Notes:
                            </h5>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded prose prose-sm max-w-none prose-slate dark:prose-invert prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-headings:text-gray-800 dark:prose-headings:text-gray-200 prose-ul:text-gray-600 dark:prose-ul:text-gray-400">
                              <ReactMarkdown
                                components={{
                                  br: () => <br />
                                }}
                              >
                                {definition.notes.replace(/\\n/g, '\n')}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  How familiar are you with this word?
                </p>
              </div>

              {/* Horizontal Familiarity Buttons */}
              <div className="flex justify-center space-x-4 mb-8">
                <button
                  onClick={() => handleFamiliaritySelect('red')}
                  className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-900/20
                             border-2 border-red-200 dark:border-red-700 rounded-lg
                             hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors min-w-[150px]"
                >
                  <div className="w-6 h-6 bg-red-500 rounded-full mb-2"></div>
                  <div className="text-center">
                    <div className="text-xs text-red-600 dark:text-red-400">Unfamiliar</div>
                  </div>
                </button>

                <button
                  onClick={() => handleFamiliaritySelect('yellow')}
                  className="flex flex-col items-center p-4 bg-yellow-50 dark:bg-yellow-900/20
                             border-2 border-yellow-200 dark:border-yellow-700 rounded-lg
                             hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors min-w-[150px]"
                >
                  <div className="w-6 h-6 bg-yellow-500 rounded-full mb-2"></div>
                  <div className="text-center">
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">Somewhat Familiar</div>
                  </div>
                </button>

                <button
                  onClick={() => handleFamiliaritySelect('green')}
                  className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20
                             border-2 border-green-200 dark:border-green-700 rounded-lg
                             hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors min-w-[150px]"
                >
                  <div className="w-6 h-6 bg-green-500 rounded-full mb-2"></div>
                  <div className="text-center">
                    <div className="text-xs text-green-600 dark:text-green-400">Familiar</div>
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
    <div className="max-w-2xl mx-auto text-center py-12">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Quiz Completed
      </h3>
    </div>
  );
};