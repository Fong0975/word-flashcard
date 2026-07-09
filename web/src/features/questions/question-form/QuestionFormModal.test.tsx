import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Question } from '../../../types/api';
import { apiService } from '../../../lib/api';

import { QuestionFormModal } from './QuestionFormModal';

const buildQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 1,
  question: 'What is 2 + 2?',
  answer: 'A',
  option_a: '4',
  option_b: '3',
  option_c: '5',
  option_d: '6',
  count_failure_practise: 0,
  count_practise: 0,
  notes: '',
  reference: '',
  ...overrides,
});

describe('QuestionFormModal', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <QuestionFormModal isOpen={false} onClose={jest.fn()} mode='create' />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the create-mode title and an empty form', () => {
    render(<QuestionFormModal isOpen onClose={jest.fn()} mode='create' />);

    expect(
      screen.getByRole('heading', { name: 'Add New Question' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Question/ })).toHaveValue('');
    expect(
      screen.getByRole('button', { name: 'Add Question' }),
    ).toBeInTheDocument();
  });

  it('shows the edit-mode title with the question pre-filled', () => {
    render(
      <QuestionFormModal
        isOpen
        onClose={jest.fn()}
        mode='edit'
        question={buildQuestion()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Edit Question' }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('What is 2 + 2?')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Update Question' }),
    ).toBeInTheDocument();
  });

  it('submits a new question and notifies the parent', async () => {
    const user = userEvent.setup();
    const createQuestionSpy = jest
      .spyOn(apiService, 'createQuestion')
      .mockResolvedValue(buildQuestion());
    const onClose = jest.fn();
    const onQuestionSaved = jest.fn();
    render(
      <QuestionFormModal
        isOpen
        onClose={onClose}
        onQuestionSaved={onQuestionSaved}
        mode='create'
      />,
    );

    await user.type(
      screen.getByRole('textbox', { name: /Question/ }),
      'New question?',
    );
    await user.type(screen.getByLabelText(/Option A/), '4');
    await user.selectOptions(screen.getByLabelText(/Correct Answer/), 'A');

    await user.click(screen.getByRole('button', { name: 'Add Question' }));

    await waitFor(() => expect(createQuestionSpy).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onQuestionSaved).toHaveBeenCalled();
  });

  it('shows an error message when submission fails', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'createQuestion')
      .mockRejectedValue(new Error('network down'));
    render(<QuestionFormModal isOpen onClose={jest.fn()} mode='create' />);

    await user.type(
      screen.getByRole('textbox', { name: /Question/ }),
      'New question?',
    );
    await user.type(screen.getByLabelText(/Option A/), '4');
    await user.selectOptions(screen.getByLabelText(/Correct Answer/), 'A');
    await user.click(screen.getByRole('button', { name: 'Add Question' }));

    expect(await screen.findByText('network down')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<QuestionFormModal isOpen onClose={onClose} mode='create' />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
