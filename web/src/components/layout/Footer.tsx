import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          © 2026 Flashcard 複習系統. 專為高效學習而設計.
        </p>
      </div>
    </footer>
  );
};