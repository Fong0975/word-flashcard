import React from 'react';

import { Question, QuestionQuizResult } from '../../../../types/api';
import { ShuffledOption } from '../types';
import { formatAccuracyWithCount } from '../utils/formatAccuracy';

import { AnswerReviewList } from './AnswerReviewList';
import { ReferenceAndExplanation } from './ReferenceAndExplanation';

interface AnswerReviewStageProps {
  /** The answered question, carrying its statistics from before the answer. */
  question: Question;
  options: ShuffledOption[];
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  updatedStats: QuestionQuizResult['updatedStats'];
  /** Extra content shown below the explanation. */
  children?: React.ReactNode;
}

/**
 * The quiz stage that reveals the outcome of an answer and explains it.
 */
export const AnswerReviewStage: React.FC<AnswerReviewStageProps> = ({
  question,
  options,
  selectedAnswer,
  correctAnswer,
  isCorrect,
  updatedStats,
  children,
}) => (
  // The negative margin pushes the scrollbar into the card's horizontal
  // padding, and the matching padding keeps the content clear of it.
  <div className='-mr-2 flex-1 overflow-y-auto pr-2 lg:-mr-3 lg:pr-3'>
    <div>
      <span className='sr-only'>
        Result: {isCorrect ? 'correct' : 'incorrect'}
      </span>
      {/* Question Display */}
      <div className='mb-6'>
        <p className='text-supporting mb-1 text-xs'>#{question.id}</p>
        <h1 className='mb-1 text-xl leading-relaxed font-bold text-gray-900 lg:text-2xl dark:text-white'>
          {question.question}
        </h1>
        <p className='text-supporting mb-4 text-xs'>
          Accuracy:{' '}
          {formatAccuracyWithCount(
            question.count_practise,
            question.count_failure_practise,
          )}{' '}
          →{' '}
          {formatAccuracyWithCount(
            updatedStats.countPractise,
            updatedStats.countFailurePractise,
          )}
        </p>

        {/* All Options (with correct answer highlighted) */}
        <AnswerReviewList
          options={options}
          selectedAnswer={selectedAnswer}
          correctAnswer={correctAnswer}
          isCorrect={isCorrect}
        />
      </div>

      <ReferenceAndExplanation
        reference={question.reference}
        notes={question.notes}
      />

      <div className='mt-12'>{children}</div>
    </div>
  </div>
);
