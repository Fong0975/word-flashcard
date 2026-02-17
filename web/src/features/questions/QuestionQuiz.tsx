import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { Question, QuestionQuizResult, QuestionsRandomRequest } from '../../types/api';
import { apiService } from '../../lib/api';

interface QuestionQuizProps {
  questionCount: number;
  onQuizComplete: (results: QuestionQuizResult[]) => void;
  onBackToHome: () => void;
}

type QuizState = 'loading' | 'quiz' | 'completed';

export const QuestionQuiz: React.FC<QuestionQuizProps> = ({
  questionCount,
  onQuizComplete,
  onBackToHome
}) => {
  const [state, setState] = useState<QuizState>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<QuestionQuizResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + (showAnswer ? 0.5 : 0)) / questions.length) * 100 : 0;

  // Fetch random questions for quiz
  useEffect(() => {
    const fetchQuizQuestions = async () => {
      try {
        setState('loading');
        setError(null);

        console.log('Fetching random questions:', { count: questionCount });

        const request: QuestionsRandomRequest = {
          count: questionCount
        };

        const fetchedQuestions = await apiService.getRandomQuestions(request);

        if (fetchedQuestions.length === 0) {
          setError('No questions available for quiz. Please add some questions first.');
          return;
        }

        setQuestions(fetchedQuestions);
        setState('quiz');
      } catch (error) {
        console.error('Failed to fetch quiz questions:', error);
        setError(error instanceof Error ? error.message : 'Failed to load quiz questions');
      }
    };

    fetchQuizQuestions();
  }, [questionCount]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.answer;

    // Add result to results array
    const newResult: QuestionQuizResult = {
      question: currentQuestion,
      userAnswer: selectedAnswer,
      isCorrect
    };

    const newResults = [...results, newResult];
    setResults(newResults);
    setShowAnswer(true);
  };

  // Update question statistics after quiz completion
  const updateQuestionStatistics = async (results: QuestionQuizResult[]) => {
    try {
      console.log('Updating question statistics...');

      // Update each question's statistics
      for (const result of results) {
        const question = result.question;

        // Calculate new statistics
        const newCountPractise = question.count_practise + 1;
        const newCountFailurePractise = result.isCorrect
          ? question.count_failure_practise
          : question.count_failure_practise + 1;

        // Update question with new statistics (preserve all other fields)
        await apiService.updateQuestion(question.id, {
          question: question.question,
          answer: question.answer,
          option_a: question.option_a,
          option_b: question.option_b || '',
          option_c: question.option_c || '',
          option_d: question.option_d || '',
          notes: question.notes,
          reference: question.reference,
          count_practise: newCountPractise,
          count_failure_practise: newCountFailurePractise,
        });

        console.log(`Updated question ${question.id}: practise ${question.count_practise} -> ${newCountPractise}, failures ${question.count_failure_practise} -> ${newCountFailurePractise}`);
      }
    } catch (error) {
      console.error('Failed to update question statistics:', error);
      // Don't block the quiz completion on statistics update failure
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
      setSelectedAnswer(null);
    } else {
      // Quiz completed - update statistics first
      const finalResults = [...results];

      // Update question statistics in background
      updateQuestionStatistics(finalResults);

      // Complete quiz
      setState('completed');
      onQuizComplete(finalResults);
    }
  };

  // Get available options (filter out empty options)
  const getAvailableOptions = (question: Question) => {
    const options = [];
    if (question.option_a) options.push({ key: 'A', value: question.option_a });
    if (question.option_b) options.push({ key: 'B', value: question.option_b });
    if (question.option_c) options.push({ key: 'C', value: question.option_c });
    if (question.option_d) options.push({ key: 'D', value: question.option_d });
    return options;
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-red-500 dark:text-red-400 text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Quiz Error
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {error}
        </p>
        <button
          onClick={onBackToHome}
          className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700
                     hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors
                     focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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

  if (state === 'quiz' && currentQuestion) {
    const availableOptions = getAvailableOptions(currentQuestion);

    return (
      <div className="h-full flex flex-col">
        {/* Progress Bar */}
        <div className="flex-shrink-0 mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
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
          // Stage 1: Question and options
          <>
            {/* Question Display */}
            <div className="flex-1 flex flex-col">
              <div className="mb-8">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-6 leading-relaxed">
                  {currentQuestion.question}
                </h1>

                {/* Options */}
                <div className="space-y-3">
                  {availableOptions.map((option) => (
                    <label
                      key={option.key}
                      className={`
                        flex items-start space-x-3 p-3 lg:p-4 rounded-lg border cursor-pointer transition-colors
                        ${selectedAnswer === option.key
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-2 ring-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={option.key}
                        checked={selectedAnswer === option.key}
                        onChange={(e) => handleAnswerSelect(e.target.value)}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mt-1 focus:outline-none"
                      />
                      <div className="flex-1">
                        <div className="flex items-start space-x-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium text-sm flex-shrink-0">
                            {option.key}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {option.value}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Action */}
            <div className="flex-shrink-0 text-center">
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className="px-8 py-3 md:text-lg font-medium text-white
                           bg-blue-500 hover:bg-blue-600
                           rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                           disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                Submit Answer
              </button>
            </div>
          </>
        ) : (
          // Stage 2: Answer and explanation
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              {/* Question Display */}
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4 leading-relaxed">
                  {currentQuestion.question}
                </h1>

                {/* User's Answer vs Correct Answer */}
                <div className="mb-6 space-y-3">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Your Answer:</span>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      results[results.length - 1]?.isCorrect
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                    }`}>
                      {selectedAnswer}
                      {results[results.length - 1]?.isCorrect ? ' ✓' : ' ✗'}
                    </div>
                  </div>

                  {!results[results.length - 1]?.isCorrect && (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Correct Answer:</span>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                        {currentQuestion.answer}
                      </div>
                    </div>
                  )}
                </div>

                {/* All Options (with correct answer highlighted) */}
                <div className="space-y-2 mb-6">
                  {availableOptions.map((option) => (
                    <div
                      key={option.key}
                      className={`flex items-start space-x-3 p-3 rounded-lg ${
                        option.key === currentQuestion.answer
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-medium text-sm flex-shrink-0 ${
                        option.key === currentQuestion.answer
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}>
                        {option.key}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                        {option.value}
                        {option.key === currentQuestion.answer && (
                          <span className="ml-2 text-green-600 dark:text-green-400 font-medium">✓ Correct</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reference */}
              {currentQuestion.reference && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Reference
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {currentQuestion.reference}
                    </p>
                  </div>
                </div>
              )}

              {/* Explanation */}
              {currentQuestion.notes && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Explanation
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="prose prose-sm max-w-none prose-slate dark:prose-invert prose-p:text-gray-600 dark:prose-p:text-gray-400">
                      <div className="
                        prose prose-sm max-w-none prose-slate dark:prose-invert 
                        prose-p:text-gray-600 dark:prose-p:text-gray-400
                        /* 1. Remove the default backticks */
                        prose-code:before:content-none 
                        prose-code:after:content-none
                        /* 2. Add special markup styles (e.g., gray background, pink text, rounded corners) */
                        prose-code:bg-gray-100 dark:prose-code:bg-gray-800
                        prose-code:text-pink-500 dark:prose-code:text-pink-400
                        prose-code:px-1.5 prose-code:py-0.5
                        prose-code:rounded-md
                        prose-code:font-medium
                      ">
                        <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                          {currentQuestion.notes.replace(/\\n/g, '\n')}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Button */}
              <div className="text-center pb-2 md:pb-4 lg:pb-8">
                <button
                  onClick={handleNextQuestion}
                  className="px-8 py-3 md:text-lg font-medium text-white
                             bg-green-500 hover:bg-green-600
                             rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};