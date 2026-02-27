import React from 'react';

import { Header, TabNavigation, TabContent, Footer } from './components';
import { useTab } from './hooks/useTab';

function App() {
  const { currentTab, switchTab } = useTab();

  return (
    <div className='flex min-h-screen flex-col bg-gray-50 pt-[env(safe-area-inset-top)] transition-colors duration-300 dark:bg-gray-900'>
      <Header />

      {/* Main Content Area */}
      <main className='mx-auto max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8'>
        {/* Welcome Section */}
        <div className='mb-8'>
          <h2 className='mb-4 text-3xl font-bold text-gray-900 dark:text-white'>
            Welcome to use Flashcard
          </h2>
          <p className='text-lg text-gray-600 dark:text-gray-300'>
            Begin your learning journey and enhance your learning effectiveness
            with flashcards.
          </p>
        </div>

        {/* Tab Navigation and Content */}
        <div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
          <TabNavigation currentTab={currentTab} onTabChange={switchTab} />
          <TabContent currentTab={currentTab} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
