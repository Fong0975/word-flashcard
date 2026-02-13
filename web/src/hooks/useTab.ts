import { useState, useEffect, useCallback } from 'react';

export type TabName = 'words' | 'questions';

export const useTab = () => {
  const [currentTab, setCurrentTab] = useState<TabName>(() => {
    // Get tab from URL on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromURL = urlParams.get('tab') as TabName;
    return tabFromURL && ['words', 'questions'].includes(tabFromURL) ? tabFromURL : 'words';
  });

  const switchTab = useCallback((tabName: TabName) => {
    if (currentTab === tabName) return;

    setCurrentTab(tabName);

    // Update URL without page reload
    const url = new URL(window.location.href);
    if (tabName !== 'words') { // Don't add parameter for default tab
      url.searchParams.set('tab', tabName);
    } else {
      url.searchParams.delete('tab');
    }
    window.history.replaceState({}, '', url);

    // Trigger custom event for analytics or other components
    const event = new CustomEvent('tabChange', {
      detail: { tabName, previousTab: currentTab }
    });
    document.dispatchEvent(event);
  }, [currentTab]);

  // Listen for browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabFromURL = urlParams.get('tab') as TabName;

      if (tabFromURL && ['words', 'questions'].includes(tabFromURL)) {
        setCurrentTab(tabFromURL);
      } else {
        setCurrentTab('words');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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