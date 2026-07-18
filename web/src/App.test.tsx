import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from './App';

// HomePage's own composition (Header/TabNavigation/TabContent/Footer) and
// every routed page each have their own dedicated tests; here they're
// stubbed so this file stays focused on App's one real responsibility: the
// routing table itself, which isn't protected by TypeScript (a typo'd path
// or a component wired to the wrong route wouldn't be caught at compile time).
jest.mock('./components', () => ({
  Header: () => <div>Header Stub</div>,
  TabNavigation: () => <div>TabNavigation Stub</div>,
  TabContent: () => <div>TabContent Stub</div>,
  Footer: () => <div>Footer Stub</div>,
}));

jest.mock('./features/words/word-detail/WordDetailPage', () => ({
  WordDetailPage: () => <div>WordDetailPage Stub</div>,
}));

jest.mock('./features/words/quiz/WordQuizPage', () => ({
  WordQuizPage: () => <div>WordQuizPage Stub</div>,
}));

jest.mock('./features/questions/question-detail/QuestionDetailPage', () => ({
  QuestionDetailPage: () => <div>QuestionDetailPage Stub</div>,
}));

jest.mock('./features/questions/quiz/QuestionQuizPage', () => ({
  QuestionQuizPage: () => <div>QuestionQuizPage Stub</div>,
}));

jest.mock('./features/notes/note-detail/NoteDetailPage', () => ({
  NoteDetailPage: () => <div>NoteDetailPage Stub</div>,
}));

jest.mock('./features/notes/note-form/NoteCreatePage', () => ({
  NoteCreatePage: () => <div>NoteCreatePage Stub</div>,
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe('App routing', () => {
  it('renders the home page layout at /', () => {
    renderAt('/');

    expect(screen.getByText('Header Stub')).toBeInTheDocument();
    expect(screen.getByText('TabNavigation Stub')).toBeInTheDocument();
    expect(screen.getByText('TabContent Stub')).toBeInTheDocument();
    expect(screen.getByText('Footer Stub')).toBeInTheDocument();
    expect(screen.getByText('Welcome to use Flashcard')).toBeInTheDocument();
  });

  it.each([
    ['/word/quiz', 'WordQuizPage Stub'],
    ['/word/apple', 'WordDetailPage Stub'],
    ['/question/quiz', 'QuestionQuizPage Stub'],
    ['/question/1', 'QuestionDetailPage Stub'],
    ['/note/new', 'NoteCreatePage Stub'],
    ['/note/1', 'NoteDetailPage Stub'],
  ])('routes %s to the correct page', (path, expectedText) => {
    renderAt(path);

    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });
});
