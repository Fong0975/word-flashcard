import React from 'react';

import { Header, TabNavigation, TabContent, Footer } from './components';
import { useTab } from './hooks/useTab';

function App() {
  const { currentTab, switchTab } = useTab();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 pt-[env(safe-area-inset-top)]">
      <Header />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to use Flashcard
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Begin your learning journey and enhance your learning effectiveness with flashcards.
          </p>
        </div>

        {/* Tab Navigation and Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <TabNavigation currentTab={currentTab} onTabChange={switchTab} />
          <TabContent currentTab={currentTab} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
