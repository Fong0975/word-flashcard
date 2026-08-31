import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import { Header, TabNavigation, TabContent } from './components';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { useTab } from './hooks/useTab';

// Code-split every routed page other than the home page itself, so the
// initial bundle only ships what the home page needs.
const WordDetailPage = lazy(() =>
  import('./features/words/word-detail/WordDetailPage').then(m => ({
    default: m.WordDetailPage,
  })),
);
const WordQuizPage = lazy(() =>
  import('./features/words/quiz/WordQuizPage').then(m => ({
    default: m.WordQuizPage,
  })),
);
const QuestionDetailPage = lazy(() =>
  import('./features/questions/question-detail/QuestionDetailPage').then(m => ({
    default: m.QuestionDetailPage,
  })),
);
const QuestionQuizPage = lazy(() =>
  import('./features/questions/quiz/QuestionQuizPage').then(m => ({
    default: m.QuestionQuizPage,
  })),
);
const NoteDetailPage = lazy(() =>
  import('./features/notes/note-detail/NoteDetailPage').then(m => ({
    default: m.NoteDetailPage,
  })),
);
const NoteCreatePage = lazy(() =>
  import('./features/notes/note-form/NoteCreatePage').then(m => ({
    default: m.NoteCreatePage,
  })),
);
const LogsPage = lazy(() =>
  import('./features/logs/LogsPage').then(m => ({
    default: m.LogsPage,
  })),
);

function HomePage() {
  const { currentTab, switchTab } = useTab();

  return (
    <div className='flex min-h-screen flex-col bg-gray-50 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] transition-colors duration-300 dark:bg-gray-900 sm:pb-0'>
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
    </div>
  );
}

function App() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
          <LoadingSpinner />
        </div>
      }
    >
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/word/quiz' element={<WordQuizPage />} />
        <Route path='/word/:wordText' element={<WordDetailPage />} />
        <Route path='/question/quiz' element={<QuestionQuizPage />} />
        <Route path='/question/:id' element={<QuestionDetailPage />} />
        <Route path='/note/new' element={<NoteCreatePage />} />
        <Route path='/note/:id' element={<NoteDetailPage />} />
        <Route path='/logs' element={<LogsPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
