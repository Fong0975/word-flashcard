import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QuestionActions } from './QuestionActions';

describe('QuestionActions', () => {
  it('calls onEdit when the edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <QuestionActions
        onEdit={onEdit}
        onCopy={vi.fn()}
        onDelete={vi.fn()}
        copyText='question text'
      />,
    );

    await user.click(screen.getByTitle('Edit question'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when the delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <QuestionActions
        onEdit={vi.fn()}
        onCopy={vi.fn()}
        onDelete={onDelete}
        copyText='question text'
      />,
    );

    await user.click(screen.getByTitle('Delete question'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders a copy button for the given text', () => {
    render(
      <QuestionActions
        onEdit={vi.fn()}
        onCopy={vi.fn()}
        onDelete={vi.fn()}
        copyText='question text'
      />,
    );

    expect(
      screen.getByTitle('Copy question and options to clipboard'),
    ).toBeInTheDocument();
  });
});
