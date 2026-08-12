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
  fetchEntities: vi.fn().mockResolvedValue(undefined),
  nextPage: vi.fn().mockResolvedValue(undefined),
  previousPage: vi.fn().mockResolvedValue(undefined),
  goToPage: vi.fn().mockResolvedValue(undefined),
  goToFirst: vi.fn().mockResolvedValue(undefined),
  goToLast: vi.fn().mockResolvedValue(undefined),
  refresh: vi.fn().mockResolvedValue(undefined),
  clearError: vi.fn(),
  setSearchTerm: vi.fn(),
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
    const clearError = vi.fn();
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

  it('reloads the page when the error retry action is clicked', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, reload },
      writable: true,
    });

    render(
      <EntityReviewTab
        config={buildConfig()}
        actions={buildActions()}
        entityListHook={buildEntityListHook({
          error: 'Failed to load words',
        })}
        renderCard={entity => <span>{entity.name}</span>}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reload).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('commits a typed term and clears it via Clear button', async () => {
    const user = userEvent.setup();
    const setSearchTerm = vi.fn();
    const onSearch = vi.fn();
    render(
      <EntityReviewTab
        config={buildConfig()}
        actions={buildActions({ onSearch })}
        entityListHook={buildEntityListHook({ setSearchTerm })}
        renderCard={entity => <span>{entity.name}</span>}
      />,
    );

    await user.type(screen.getByPlaceholderText('Search words...'), 'app');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(setSearchTerm).toHaveBeenCalledWith('');
    expect(onSearch).toHaveBeenCalledWith('');
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
        actions={buildActions({ onQuizSetup: vi.fn() })}
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
        actions={buildActions({ onQuizSetup: vi.fn() })}
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
    const onNew = vi.fn();
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
    const onRefresh = vi.fn().mockResolvedValue(undefined);
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
