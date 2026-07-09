import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  EntityListHook,
  BaseEntity,
  EntityReviewConfig,
  EntityReviewActions,
} from '../../../types';

import { EntityReviewTab } from './EntityReviewTab';

interface TestEntity extends BaseEntity {
  name: string;
}

const buildEntityListHook = (
  overrides: Partial<EntityListHook<TestEntity>> = {},
): EntityListHook<TestEntity> => ({
  entities: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
  itemsPerPage: 10,
  searchTerm: '',
  totalCount: 0,
  fetchEntities: jest.fn().mockResolvedValue(undefined),
  nextPage: jest.fn().mockResolvedValue(undefined),
  previousPage: jest.fn().mockResolvedValue(undefined),
  goToPage: jest.fn().mockResolvedValue(undefined),
  goToFirst: jest.fn().mockResolvedValue(undefined),
  goToLast: jest.fn().mockResolvedValue(undefined),
  refresh: jest.fn().mockResolvedValue(undefined),
  clearError: jest.fn(),
  setSearchTerm: jest.fn(),
  ...overrides,
});

const buildConfig = (
  overrides: Partial<EntityReviewConfig> = {},
): EntityReviewConfig => ({
  title: 'Words',
  entityName: 'word',
  entityNamePlural: 'words',
  enableSearch: true,
  ...overrides,
});

const buildActions = (
  overrides: Partial<EntityReviewActions> = {},
): EntityReviewActions => ({
  ...overrides,
});

describe('EntityReviewTab', () => {
  it('shows a loading skeleton on the initial load', () => {
    render(
      <EntityReviewTab
        config={buildConfig()}
        actions={buildActions()}
        entityListHook={buildEntityListHook({ loading: true })}
        renderCard={entity => <span>{entity.name}</span>}
      />,
    );

    expect(screen.getByText('Words')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders the title and description', () => {
    render(
      <EntityReviewTab
        config={buildConfig()}
        actions={buildActions()}
        entityListHook={buildEntityListHook()}
        renderCard={entity => <span>{entity.name}</span>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Words' })).toBeInTheDocument();
    expect(
      screen.getByText('Manage and review your words'),
    ).toBeInTheDocument();
  });

  it('renders the search bar when search is enabled', () => {
    render(
      <EntityReviewTab
        config={buildConfig({ enableSearch: true })}
        actions={buildActions()}
        entityListHook={buildEntityListHook()}
        renderCard={entity => <span>{entity.name}</span>}
      />,
    );

    expect(screen.getByPlaceholderText('Search words...')).toBeInTheDocument();
  });

  it('does not render the search bar when search is disabled', () => {
    render(
      <EntityReviewTab
        config={buildConfig({ enableSearch: false })}
        actions={buildActions()}
        entityListHook={buildEntityListHook()}
        renderCard={entity => <span>{entity.name}</span>}
      />,
    );

    expect(
      screen.queryByPlaceholderText('Search words...'),
    ).not.toBeInTheDocument();
  });

  it('shows the error state and clears it on dismiss', async () => {
    const user = userEvent.setup();
    const clearError = jest.fn();
    render(
      <EntityReviewTab
        config={buildConfig()}
        actions={buildActions()}
        entityListHook={buildEntityListHook({
          error: 'Failed to load words',
          clearError,
        })}
        renderCard={entity => <span>{entity.name}</span>}
      />,
    );

    expect(screen.getByText('Failed to load words')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(clearError).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state when there are no entities and no search term', () => {
    render(
      <EntityReviewTab
        config={buildConfig()}
        actions={buildActions()}
        entityListHook={buildEntityListHook({ entities: [] })}
        renderCard={entity => <span>{entity.name}</span>}
      />,
    );

    expect(screen.getByText('No words found')).toBeInTheDocument();
  });

  it('shows a no-results message when a search returns nothing', () => {
    render(
      <EntityReviewTab
        config={buildConfig()}
        actions={buildActions()}
        entityListHook={buildEntityListHook({
          entities: [],
          searchTerm: 'xyz',
        })}
        renderCard={entity => <span>{entity.name}</span>}
      />,
    );

    expect(screen.getByText(/No words match "xyz"/)).toBeInTheDocument();
  });

  it('renders a card for each entity', () => {
    render(
      <EntityReviewTab
        config={buildConfig()}
        actions={buildActions()}
        entityListHook={buildEntityListHook({
          entities: [
            { id: 1, name: 'apple' },
            { id: 2, name: 'banana' },
          ],
          totalCount: 2,
        })}
        renderCard={entity => <span>{entity.name}</span>}
      />,
    );

    expect(screen.getByText('apple')).toBeInTheDocument();
    expect(screen.getByText('banana')).toBeInTheDocument();
  });

  it('shows the Quiz button only when enabled, entities exist, and a handler is provided', () => {
    const { rerender } = render(
      <EntityReviewTab
        config={buildConfig({ enableQuiz: true })}
        actions={buildActions({ onQuizSetup: jest.fn() })}
        entityListHook={buildEntityListHook({
          entities: [{ id: 1, name: 'apple' }],
          totalCount: 1,
        })}
        renderCard={entity => <span>{entity.name}</span>}
      />,
    );
    expect(screen.getByRole('button', { name: /Quiz/ })).toBeInTheDocument();

    rerender(
      <EntityReviewTab
        config={buildConfig({ enableQuiz: true })}
        actions={buildActions({ onQuizSetup: jest.fn() })}
        entityListHook={buildEntityListHook({ entities: [] })}
        renderCard={entity => <span>{entity.name}</span>}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /Quiz/ }),
    ).not.toBeInTheDocument();
  });

  it('calls actions.onNew when the Add button is clicked', async () => {
    const user = userEvent.setup();
    const onNew = jest.fn();
    render(
      <EntityReviewTab
        config={buildConfig()}
        actions={buildActions({ onNew })}
        entityListHook={buildEntityListHook()}
        renderCard={entity => <span>{entity.name}</span>}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Add/ }));
    expect(onNew).toHaveBeenCalledTimes(1);
  });

  it('refreshes and shows a success toast when the Refresh button is clicked', async () => {
    const user = userEvent.setup();
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    render(
      <EntityReviewTab
        config={buildConfig()}
        actions={buildActions({ onRefresh })}
        entityListHook={buildEntityListHook()}
        renderCard={entity => <span>{entity.name}</span>}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Refresh successful!')).toBeInTheDocument();
  });

  it('renders toolbar, quick filters, and additional content', () => {
    render(
      <EntityReviewTab
        config={buildConfig()}
        actions={buildActions()}
        entityListHook={buildEntityListHook()}
        renderCard={entity => <span>{entity.name}</span>}
        toolbarContent={<div>Toolbar content</div>}
        quickFiltersContent={<div>Quick filters</div>}
        additionalContent={<div>Additional content</div>}
      />,
    );

    expect(screen.getByText('Toolbar content')).toBeInTheDocument();
    expect(screen.getByText('Quick filters')).toBeInTheDocument();
    expect(screen.getByText('Additional content')).toBeInTheDocument();
  });
});
