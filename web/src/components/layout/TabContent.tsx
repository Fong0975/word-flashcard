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
      題目練習功能
    </h3>
    <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
      這裡將提供題目的複習與隨機測驗功能。您可以進行各種類型的練習題，包括選擇題、填空題等，並獲得即時的學習反饋。
    </p>
    <div className="mt-6">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
        即將推出
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