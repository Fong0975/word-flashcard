import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EntityReviewSearchBar } from './EntityReviewSearchBar';

describe('EntityReviewSearchBar', () => {
  it('renders the value and placeholder', () => {
    render(
      <EntityReviewSearchBar
        value='cat'
        onChange={vi.fn()}
        onCompositionStart={vi.fn()}
        onCompositionEnd={vi.fn()}
        onClear={vi.fn()}
        placeholder='Search words...'
      />,
    );

    expect(screen.getByPlaceholderText('Search words...')).toHaveValue('cat');
  });

  it('calls onChange as the user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <EntityReviewSearchBar
        value=''
        onChange={onChange}
        onCompositionStart={vi.fn()}
        onCompositionEnd={vi.fn()}
        onClear={vi.fn()}
        placeholder='Search...'
      />,
    );

    await user.type(screen.getByPlaceholderText('Search...'), 'c');
    expect(onChange).toHaveBeenCalled();
  });

  it('does not render the clear button when the value is empty', () => {
    render(
      <EntityReviewSearchBar
        value=''
        onChange={vi.fn()}
        onCompositionStart={vi.fn()}
        onCompositionEnd={vi.fn()}
        onClear={vi.fn()}
        placeholder='Search...'
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Clear search' }),
    ).not.toBeInTheDocument();
  });

  it('calls onClear when the clear button is clicked', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <EntityReviewSearchBar
        value='cat'
        onChange={vi.fn()}
        onCompositionStart={vi.fn()}
        onCompositionEnd={vi.fn()}
        onClear={onClear}
        placeholder='Search...'
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      name: 'onAdd provided with a value',
      value: 'cat',
      onAdd: true,
      shown: true,
    },
    {
      name: 'onAdd provided with empty value',
      value: '',
      onAdd: true,
      shown: false,
    },
    { name: 'onAdd omitted', value: 'cat', onAdd: false, shown: false },
  ])('add button visibility: $name', ({ value, onAdd, shown }) => {
    render(
      <EntityReviewSearchBar
        value={value}
        onChange={vi.fn()}
        onCompositionStart={vi.fn()}
        onCompositionEnd={vi.fn()}
        onClear={vi.fn()}
        onAdd={onAdd ? vi.fn() : undefined}
        placeholder='Search...'
      />,
    );

    const button = screen.queryByRole('button', { name: 'Add from search' });
    if (shown) {
      expect(button).toBeInTheDocument();
    } else {
      expect(button).not.toBeInTheDocument();
    }
  });

  it('calls onAdd when the add button is clicked', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <EntityReviewSearchBar
        value='cat'
        onChange={vi.fn()}
        onCompositionStart={vi.fn()}
        onCompositionEnd={vi.fn()}
        onClear={vi.fn()}
        onAdd={onAdd}
        placeholder='Search...'
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add from search' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('fires composition start/end handlers', () => {
    const onCompositionStart = vi.fn();
    const onCompositionEnd = vi.fn();
    render(
      <EntityReviewSearchBar
        value=''
        onChange={vi.fn()}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onClear={vi.fn()}
        placeholder='Search...'
      />,
    );

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.compositionStart(input);
    expect(onCompositionStart).toHaveBeenCalledTimes(1);

    fireEvent.compositionEnd(input);
    expect(onCompositionEnd).toHaveBeenCalledTimes(1);
  });

  it('renders quick filters content when provided', () => {
    render(
      <EntityReviewSearchBar
        value=''
        onChange={vi.fn()}
        onCompositionStart={vi.fn()}
        onCompositionEnd={vi.fn()}
        onClear={vi.fn()}
        placeholder='Search...'
        quickFiltersContent={<div>Quick filters</div>}
      />,
    );

    expect(screen.getByText('Quick filters')).toBeInTheDocument();
  });
});
