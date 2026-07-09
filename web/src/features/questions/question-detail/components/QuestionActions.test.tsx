import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QuestionActions } from './QuestionActions';

describe('QuestionActions', () => {
  it('calls onEdit when the edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    render(
      <QuestionActions
        onEdit={onEdit}
        onCopy={jest.fn()}
        onDelete={jest.fn()}
        copyText='question text'
      />,
    );

    await user.click(screen.getByTitle('Edit question'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when the delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    render(
      <QuestionActions
        onEdit={jest.fn()}
        onCopy={jest.fn()}
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
        onEdit={jest.fn()}
        onCopy={jest.fn()}
        onDelete={jest.fn()}
        copyText='question text'
      />,
    );

    expect(
      screen.getByTitle('Copy question and options to clipboard'),
    ).toBeInTheDocument();
  });
});
