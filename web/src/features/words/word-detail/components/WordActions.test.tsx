import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Word } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';

import { WordActions } from './WordActions';

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.GREEN,
  reminder: null,
  count_practise: 0,
  definitions: [],
  ...overrides,
});

describe('WordActions', () => {
  it('links to the Cambridge Dictionary entry for the word', () => {
    render(
      <WordActions
        word={buildWord()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    const link = screen.getByTitle('Open in Cambridge Dictionary');
    expect(link).toHaveAttribute('href', expect.stringContaining('/apple'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('calls onEdit when the edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    render(
      <WordActions word={buildWord()} onEdit={onEdit} onDelete={jest.fn()} />,
    );

    await user.click(screen.getByTitle('Edit word'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when the delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    render(
      <WordActions word={buildWord()} onEdit={jest.fn()} onDelete={onDelete} />,
    );

    await user.click(screen.getByTitle('Delete word'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
