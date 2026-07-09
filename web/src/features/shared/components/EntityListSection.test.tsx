import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BaseEntity } from '../../../types/base';

import { EntityListSection } from './EntityListSection';

interface TestEntity extends BaseEntity {
  name: string;
}

const buildEntities = (count: number): TestEntity[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `word-${i + 1}`,
  }));

const baseProps = {
  onPageChange: jest.fn(),
  onNext: jest.fn(),
  onPrevious: jest.fn(),
  onFirst: jest.fn(),
  onLast: jest.fn(),
  entityNamePlural: 'Words',
};

describe('EntityListSection', () => {
  it('renders a card for each entity with the sequence-adjusted index', () => {
    const renderCard = jest.fn((entity: TestEntity) => (
      <span>{entity.name}</span>
    ));
    render(
      <EntityListSection
        {...baseProps}
        entities={buildEntities(2)}
        renderCard={renderCard}
        currentPage={2}
        itemsPerPage={10}
        totalCount={12}
        loading={false}
        totalPages={2}
        hasNext={false}
        hasPrevious
      />,
    );

    expect(renderCard).toHaveBeenNthCalledWith(
      1,
      { id: 1, name: 'word-1' },
      11,
    );
    expect(renderCard).toHaveBeenNthCalledWith(
      2,
      { id: 2, name: 'word-2' },
      12,
    );
  });

  it('shows the total count as plain text when there is no click handler', () => {
    render(
      <EntityListSection
        {...baseProps}
        entities={buildEntities(1)}
        renderCard={() => <span>card</span>}
        currentPage={1}
        itemsPerPage={10}
        totalCount={1}
        loading={false}
        totalPages={1}
        hasNext={false}
        hasPrevious={false}
      />,
    );

    expect(screen.getByText('1 words total')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the total count as a button when onTotalCountClick is provided', async () => {
    const user = userEvent.setup();
    const onTotalCountClick = jest.fn();
    render(
      <EntityListSection
        {...baseProps}
        entities={buildEntities(1)}
        renderCard={() => <span>card</span>}
        currentPage={1}
        itemsPerPage={10}
        totalCount={1}
        loading={false}
        totalPages={1}
        hasNext={false}
        hasPrevious={false}
        onTotalCountClick={onTotalCountClick}
      />,
    );

    await user.click(screen.getByRole('button', { name: '1 words total' }));
    expect(onTotalCountClick).toHaveBeenCalledTimes(1);
  });

  it('shows a loading indicator while loading', () => {
    render(
      <EntityListSection
        {...baseProps}
        entities={buildEntities(1)}
        renderCard={() => <span>card</span>}
        currentPage={1}
        itemsPerPage={10}
        totalCount={1}
        loading
        totalPages={1}
        hasNext={false}
        hasPrevious={false}
      />,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('does not render pagination when there is only one page', () => {
    render(
      <EntityListSection
        {...baseProps}
        entities={buildEntities(1)}
        renderCard={() => <span>card</span>}
        currentPage={1}
        itemsPerPage={10}
        totalCount={1}
        loading={false}
        totalPages={1}
        hasNext={false}
        hasPrevious={false}
      />,
    );

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders pagination and forwards page changes when there is more than one page', async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();
    render(
      <EntityListSection
        {...baseProps}
        entities={buildEntities(1)}
        renderCard={() => <span>card</span>}
        currentPage={1}
        itemsPerPage={1}
        totalCount={2}
        loading={false}
        totalPages={2}
        hasNext
        hasPrevious={false}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: '2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
