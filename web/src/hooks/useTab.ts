import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export type TabName = 'words' | 'questions' | 'notes';

export const TAB_LABELS: Record<TabName, string> = {
  words: 'Words',
  questions: 'Questions',
  notes: 'Notes',
};

const isTabName = (value: string | null): value is TabName =>
  value !== null && Object.keys(TAB_LABELS).includes(value);

export const useTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromURL = searchParams.get('tab');
  // Null when the URL carries no valid ?tab param, i.e. the words tab is only
  // shown by default rather than by request.
  const explicitTab: TabName | null = isTabName(tabFromURL) ? tabFromURL : null;
  const currentTab: TabName = explicitTab ?? 'words';

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

      // Alt + 3: Switch to Notes tab
      if (event.altKey && event.code === 'Digit3') {
        event.preventDefault();
        switchTab('notes');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [switchTab]);

  return { currentTab, explicitTab, switchTab };
};
