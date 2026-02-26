import React from 'react';

import { TabName } from '../../hooks/useTab';
import { WordsReviewTab } from '../../features/words/WordsReviewTab';
import { QuestionsReviewTab } from '../../features/questions/QuestionsReviewTab';

interface TabContentProps {
  currentTab: TabName;
}

const WordsContent: React.FC = () => <WordsReviewTab />;

const QuestionsContent: React.FC = () => <QuestionsReviewTab />;

export const TabContent: React.FC<TabContentProps> = ({ currentTab }) => {
  return (
    <div className="p-6">
      {currentTab === 'words' && <WordsContent />}
      {currentTab === 'questions' && <QuestionsContent />}
    </div>
  );
};