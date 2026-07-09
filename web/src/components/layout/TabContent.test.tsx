import { render, screen } from '@testing-library/react';

import { TabContent } from './TabContent';

jest.mock('../../features/words/WordsReviewTab', () => ({
  WordsReviewTab: () => <div>Words Panel</div>,
}));
jest.mock('../../features/questions/QuestionsReviewTab', () => ({
  QuestionsReviewTab: () => <div>Questions Panel</div>,
}));
jest.mock('../../features/notes/NotesTab', () => ({
  NotesTab: () => <div>Notes Panel</div>,
}));

describe('TabContent', () => {
  it('renders the words panel for the words tab', () => {
    render(<TabContent currentTab='words' />);
    expect(screen.getByText('Words Panel')).toBeInTheDocument();
    expect(screen.queryByText('Questions Panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Notes Panel')).not.toBeInTheDocument();
  });

  it('renders the questions panel for the questions tab', () => {
    render(<TabContent currentTab='questions' />);
    expect(screen.getByText('Questions Panel')).toBeInTheDocument();
    expect(screen.queryByText('Words Panel')).not.toBeInTheDocument();
  });

  it('renders the notes panel for the notes tab', () => {
    render(<TabContent currentTab='notes' />);
    expect(screen.getByText('Notes Panel')).toBeInTheDocument();
    expect(screen.queryByText('Words Panel')).not.toBeInTheDocument();
  });
});
