import React from 'react';

import { TabName } from '../../hooks/useTab';

interface TabNavigationProps {
  currentTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  currentTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'words' as TabName, label: 'Words', icon: '📝' },
    { id: 'questions' as TabName, label: 'Questions', icon: '❓' },
  ];

  const getTabClasses = (tabId: TabName) => {
    const baseClasses =
      'focus:outline-none focus:ring-0 flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-colors duration-200';

    if (currentTab === tabId) {
      return `${baseClasses} border-blue-500 text-blue-600 dark:text-blue-400`;
    }

    return `${baseClasses} border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600`;
  };

  return (
    <div className='border-b border-gray-200 dark:border-gray-700'>
      <nav className='flex space-x-0' aria-label='Tabs'>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={getTabClasses(tab.id)}
            onClick={() => onTabChange(tab.id)}
            aria-selected={currentTab === tab.id}
            role='tab'
          >
            <span className='flex items-center justify-center space-x-2'>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};
