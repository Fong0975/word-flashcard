import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Note } from '../../types/api';

import { NoteCard } from './NoteCard';

const buildNote = (overrides: Partial<Note> = {}): Note => ({
  id: 1,
  title: 'Grocery list',
  content: null,
  sort_order: 0,
  updated_at: '2024-03-15T00:00:00Z',
  ...overrides,
});

const baseProps = {
  index: 0,
  isFirst: false,
  isLast: false,
  isDragging: false,
  isDragOver: false,
  onMoveUp: jest.fn(),
  onMoveDown: jest.fn(),
  onDragStart: jest.fn(),
  onDragOver: jest.fn(),
  onDrop: jest.fn(),
  onDragEnd: jest.fn(),
  onClick: jest.fn(),
};

describe('NoteCard', () => {
  it('renders the note title and a formatted date', () => {
    render(<NoteCard {...baseProps} note={buildNote()} />);
    expect(screen.getByText('Grocery list')).toBeInTheDocument();
    expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument();
  });

  it('shows a placeholder when there is no updated date', () => {
    render(<NoteCard {...baseProps} note={buildNote({ updated_at: null })} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('calls onClick when the content is clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<NoteCard {...baseProps} note={buildNote()} onClick={onClick} />);

    await user.click(screen.getByText('Grocery list'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables the move-up button on the first item', () => {
    render(<NoteCard {...baseProps} note={buildNote()} isFirst />);
    expect(screen.getByRole('button', { name: 'Move up' })).toBeDisabled();
  });

  it('disables the move-down button on the last item', () => {
    render(<NoteCard {...baseProps} note={buildNote()} isLast />);
    expect(screen.getByRole('button', { name: 'Move down' })).toBeDisabled();
  });

  it('calls onMoveUp and onMoveDown when clicked', async () => {
    const user = userEvent.setup();
    const onMoveUp = jest.fn();
    const onMoveDown = jest.fn();
    render(
      <NoteCard
        {...baseProps}
        note={buildNote()}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Move up' }));
    expect(onMoveUp).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Move down' }));
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });

  it('hides reorder controls when showReorderControls is false', () => {
    render(
      <NoteCard
        {...baseProps}
        note={buildNote()}
        showReorderControls={false}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Move up' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Move down' }),
    ).not.toBeInTheDocument();
  });

  it('fires drag handlers when reorder controls are enabled', () => {
    const onDragStart = jest.fn();
    const onDrop = jest.fn();
    const onDragEnd = jest.fn();
    render(
      <NoteCard
        {...baseProps}
        note={buildNote()}
        onDragStart={onDragStart}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      />,
    );

    // The draggable attribute lives on an ancestor with no accessible role of
    // its own; drag events bubble, so firing them on a descendant we can
    // query (the title) still reaches the ancestor's handlers.
    const title = screen.getByText('Grocery list');
    fireEvent.dragStart(title);
    fireEvent.drop(title);
    fireEvent.dragEnd(title);

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });
});
