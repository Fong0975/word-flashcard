import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export type TabName = 'words' | 'questions';

export const useTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromURL = searchParams.get('tab') as TabName;
  const currentTab: TabName =
    tabFromURL && ['words', 'questions'].includes(tabFromURL)
      ? tabFromURL
      : 'words';

  const switchTab = useCallback(
    (tabName: TabName) => {
      if (currentTab === tabName) {
        return;
      }

      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          if (tabName !== 'words') {
            next.set('tab', tabName);
          } else {
            next.delete('tab');
          }
          next.delete('page');
          return next;
        },
        { replace: true },
      );

      const event = new CustomEvent('tabChange', {
        detail: { tabName, previousTab: currentTab },
      });
      document.dispatchEvent(event);
    },
    [setSearchParams, currentTab],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + 1: Switch to Words tab
      if (event.altKey && event.code === 'Digit1') {
        event.preventDefault();
        switchTab('words');
      }

      // Alt + 2: Switch to Questions tab
      if (event.altKey && event.code === 'Digit2') {
        event.preventDefault();
        switchTab('questions');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [switchTab]);

  return { currentTab, switchTab };
};
