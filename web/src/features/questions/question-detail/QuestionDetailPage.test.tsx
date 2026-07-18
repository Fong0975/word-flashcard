import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { Question } from '../../../types/api';
import { apiService } from '../../../lib/api';

import { QuestionDetailPage } from './QuestionDetailPage';

const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

const buildQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 1,
  question: 'What is 2 + 2?',
  answer: 'A',
  option_a: '4',
  option_b: '5',
  option_c: '3',
  option_d: '6',
  count_failure_practise: 0,
  count_practise: 0,
  notes: '',
  reference: '',
  ...overrides,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <QuestionDetailPage />
    </MemoryRouter>,
  );

describe('QuestionDetailPage', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseParams.mockReturnValue({ id: '1' });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // DetailPageLayout renders the real Header, whose useDarkMode hook reads
    // window.matchMedia; jsdom doesn't implement it, so stub it out.
    window.matchMedia = jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('does not fetch a question when the route has no id', () => {
    mockUseParams.mockReturnValue({ id: undefined });
    const getQuestionSpy = jest.spyOn(apiService, 'getQuestion');

    renderPage();

    expect(getQuestionSpy).not.toHaveBeenCalled();
  });

  it('shows a loading spinner while fetching', () => {
    jest
      .spyOn(apiService, 'getQuestion')
      .mockReturnValue(new Promise<Question>(() => {}));

    renderPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('navigates back with browser history when Go back is clicked while loading', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'getQuestion')
      .mockReturnValue(new Promise<Question>(() => {}));

    renderPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('shows an error screen and navigates home on failure', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'getQuestion')
      .mockRejectedValue(new Error('question gone'));

    renderPage();

    expect(await screen.findByText('question gone')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to Home' }));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates home when Go back is clicked on the error screen', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'getQuestion')
      .mockRejectedValue(new Error('question gone'));

    renderPage();

    expect(await screen.findByText('question gone')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders question details, using browser-back on header', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getQuestion').mockResolvedValue(buildQuestion());

    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'What is 2 + 2?' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Question ID: 1')).toBeInTheDocument();
    expect(screen.getByText('Practice Statistics')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('toggles the answer and explanation section', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'getQuestion')
      .mockResolvedValue(buildQuestion({ notes: 'Because 2+2=4.' }));

    renderPage();
    await screen.findByRole('heading', { name: 'What is 2 + 2?' });

    expect(screen.queryByText('Correct Answer:')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Answer & Explanation/ }),
    );

    expect(screen.getByText('Correct Answer:')).toBeInTheDocument();
    expect(screen.getByText('Because 2+2=4.')).toBeInTheDocument();
  });

  it('opens the edit modal when Edit is clicked', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getQuestion').mockResolvedValue(buildQuestion());

    renderPage();
    await screen.findByRole('heading', { name: 'What is 2 + 2?' });

    expect(
      screen.queryByRole('heading', { name: 'Edit Question' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit question' }));

    expect(
      await screen.findByRole('heading', { name: 'Edit Question' }),
    ).toBeInTheDocument();
  });

  it('refetches and displays the updated question after a successful edit', async () => {
    const user = userEvent.setup();
    const updatedQuestion = buildQuestion({ question: 'What is 3 + 3?' });
    jest
      .spyOn(apiService, 'getQuestion')
      .mockResolvedValueOnce(buildQuestion())
      .mockResolvedValueOnce(updatedQuestion);
    jest.spyOn(apiService, 'updateQuestion').mockResolvedValue(updatedQuestion);

    renderPage();
    await screen.findByRole('heading', { name: 'What is 2 + 2?' });

    await user.click(screen.getByRole('button', { name: 'Edit question' }));
    await screen.findByRole('heading', { name: 'Edit Question' });

    await user.click(screen.getByRole('button', { name: 'Update Question' }));

    expect(
      await screen.findByRole('heading', { name: 'What is 3 + 3?' }),
    ).toBeInTheDocument();
  });

  it('deletes the question after confirming, closes back home', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getQuestion').mockResolvedValue(buildQuestion());
    const deleteSpy = jest
      .spyOn(apiService, 'deleteQuestion')
      .mockResolvedValue(undefined);

    renderPage();
    await screen.findByRole('heading', { name: 'What is 2 + 2?' });

    await user.click(screen.getByRole('button', { name: 'Delete question' }));
    expect(
      await screen.findByRole('heading', { name: 'Delete Question' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete Question' }));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith(1));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('cancels the delete confirmation without deleting', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getQuestion').mockResolvedValue(buildQuestion());
    const deleteSpy = jest.spyOn(apiService, 'deleteQuestion');

    renderPage();
    await screen.findByRole('heading', { name: 'What is 2 + 2?' });

    await user.click(screen.getByRole('button', { name: 'Delete question' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      screen.queryByRole('heading', { name: 'Delete Question' }),
    ).not.toBeInTheDocument();
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
