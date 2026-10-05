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
  // `iconPath` is a 24x24 outline path drawn with `currentColor`, so the icon
  // follows the tab's active / hover text color in both themes.
  const tabs = [
    {
      id: 'words' as TabName,
      label: 'Words',
      iconPath:
        'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3zM6 6h.008v.008H6V6z',
    },
    {
      id: 'questions' as TabName,
      label: 'Questions',
      iconPath:
        'M8.25 8.25a3.75 3.75 0 1 1 7.5 0c0 1.6-1 2.5-2 3.2-1 .7-1.75 1.4-1.75 2.8v.5M12 19.5h.01',
    },
    {
      id: 'notes' as TabName,
      label: 'Notes',
      iconPath:
        'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    },
  ];

  const getTabClasses = (tabId: TabName) => {
    const baseClasses =
      'focus:outline-none focus-visible:bg-primary-500/10 dark:focus-visible:bg-primary-400/20 flex-1 py-4 px-2 sm:px-6 text-sm font-medium text-center border-b-2 transition-colors duration-200';

    if (currentTab === tabId) {
      return `${baseClasses} border-primary-500 text-primary-600 dark:text-primary-400`;
    }

    return `${baseClasses} border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 focus-visible:text-gray-700 dark:focus-visible:text-gray-300 focus-visible:border-gray-300 dark:focus-visible:border-gray-600`;
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
              <svg
                className='hidden h-4 w-4 flex-shrink-0 sm:block'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='1.5'
                stroke='currentColor'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d={tab.iconPath}
                />
              </svg>
              <span>{tab.label}</span>
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};
