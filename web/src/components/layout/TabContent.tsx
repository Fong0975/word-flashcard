import React from 'react';
import { TabName } from '../../hooks/useTab';
import { WordsReview } from '../../features/words/WordsReview';

interface TabContentProps {
  currentTab: TabName;
}

const WordsContent: React.FC = () => <WordsReview />;

const QuestionsContent: React.FC = () => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">🧠</div>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
      Question Recap
    </h3>
    <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
      This section provides review materials and random quizzes. You can practice various question types, including multiple-choice and fill-in-the-blank questions, and receive instant learning feedback.
    </p>
    <div className="mt-6">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
        Coming soon
      </span>
    </div>
  </div>
);

export const TabContent: React.FC<TabContentProps> = ({ currentTab }) => {
  return (
    <div className="p-6">
      {currentTab === 'words' && <WordsContent />}
      {currentTab === 'questions' && <QuestionsContent />}
    </div>
  );
};