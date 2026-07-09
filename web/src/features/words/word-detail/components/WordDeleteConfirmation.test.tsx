import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Word } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';

import { WordDeleteConfirmation } from './WordDeleteConfirmation';

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.GREEN,
  reminder: null,
  count_practise: 0,
  definitions: [],
  ...overrides,
});

describe('WordDeleteConfirmation', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <WordDeleteConfirmation
        word={buildWord()}
        isOpen={false}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('includes the word text in the confirmation message', () => {
    render(
      <WordDeleteConfirmation
        word={buildWord({ word: 'banana' })}
        isOpen
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText(/"banana"/)).toBeInTheDocument();
  });

  it('calls onConfirm and onCancel', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(
      <WordDeleteConfirmation
        word={buildWord()}
        isOpen
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete Word' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
