import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BaseEntity } from '../../../types/base';

import { EntityCard, EntityCardConfig } from './EntityCard';

interface TestEntity extends BaseEntity {
  name: string;
}

const entity: TestEntity = { id: 1, name: 'apple' };

const buildConfig = (
  overrides: Partial<EntityCardConfig> = {},
): EntityCardConfig => ({
  showSequence: true,
  sequenceStyle: 'simple',
  showLeftIndicator: false,
  ...overrides,
});

describe('EntityCard', () => {
  it('renders the sequence number and content', () => {
    render(
      <EntityCard
        index={3}
        entity={entity}
        config={buildConfig()}
        actions={{}}
        renderContent={e => <span>{e.name}</span>}
      />,
    );

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('apple')).toBeInTheDocument();
  });

  it('renders the "No." label in detailed sequence style', () => {
    render(
      <EntityCard
        index={1}
        entity={entity}
        config={buildConfig({ sequenceStyle: 'detailed' })}
        actions={{}}
        renderContent={e => <span>{e.name}</span>}
      />,
    );

    expect(screen.getByText('No.')).toBeInTheDocument();
  });

  it('hides the sequence number when disabled', () => {
    render(
      <EntityCard
        index={1}
        entity={entity}
        config={buildConfig({ showSequence: false })}
        actions={{}}
        renderContent={e => <span>{e.name}</span>}
      />,
    );

    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('calls actions.onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <EntityCard
        index={1}
        entity={entity}
        config={buildConfig()}
        actions={{ onClick }}
        renderContent={e => <span>{e.name}</span>}
      />,
    );

    await user.click(screen.getByText('apple'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls getLeftIndicatorColor with the entity for the color-band indicator', () => {
    const getLeftIndicatorColor = jest.fn().mockReturnValue('bg-green-500');
    render(
      <EntityCard
        index={1}
        entity={entity}
        config={buildConfig({
          showLeftIndicator: true,
          leftIndicatorType: 'color-band',
        })}
        actions={{}}
        renderContent={e => <span>{e.name}</span>}
        getLeftIndicatorColor={getLeftIndicatorColor}
      />,
    );

    expect(getLeftIndicatorColor).toHaveBeenCalledWith(entity);
  });

  it('renders a custom left indicator via renderLeftIndicator', () => {
    render(
      <EntityCard
        index={1}
        entity={entity}
        config={buildConfig({
          showLeftIndicator: true,
          leftIndicatorType: 'custom',
        })}
        actions={{}}
        renderContent={e => <span>{e.name}</span>}
        renderLeftIndicator={() => <span>custom indicator</span>}
      />,
    );

    expect(screen.getByText('custom indicator')).toBeInTheDocument();
  });

  it('renders additional modals', () => {
    render(
      <EntityCard
        index={1}
        entity={entity}
        config={buildConfig()}
        actions={{}}
        renderContent={e => <span>{e.name}</span>}
        additionalModals={<div>Modal content</div>}
      />,
    );

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });
});
