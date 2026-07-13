import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CollapsibleSection } from './CollapsibleSection';

describe('CollapsibleSection', () => {
  it('renders the title but not children when closed', () => {
    render(
      <CollapsibleSection title='History' isOpen={false} onToggle={jest.fn()}>
        <p>Section content</p>
      </CollapsibleSection>,
    );

    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.queryByText('Section content')).not.toBeInTheDocument();
  });

  it('renders children when open', () => {
    render(
      <CollapsibleSection title='History' isOpen onToggle={jest.fn()}>
        <p>Section content</p>
      </CollapsibleSection>,
    );

    expect(screen.getByText('Section content')).toBeInTheDocument();
  });

  it('calls onToggle when the header button is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    render(
      <CollapsibleSection title='History' isOpen={false} onToggle={onToggle}>
        <p>Section content</p>
      </CollapsibleSection>,
    );

    await user.click(screen.getByRole('button', { name: 'History' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('sets aria-expanded to false when closed', () => {
    render(
      <CollapsibleSection title='History' isOpen={false} onToggle={jest.fn()}>
        <p>Section content</p>
      </CollapsibleSection>,
    );

    expect(screen.getByRole('button', { name: 'History' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('sets aria-expanded to true when open', () => {
    render(
      <CollapsibleSection title='History' isOpen onToggle={jest.fn()}>
        <p>Section content</p>
      </CollapsibleSection>,
    );

    expect(screen.getByRole('button', { name: 'History' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});
