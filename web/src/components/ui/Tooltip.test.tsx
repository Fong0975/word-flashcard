import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tooltip } from './Tooltip';

const renderTooltip = () =>
  render(
    <div>
      <Tooltip label='Backup contents' content='3 words · 2 questions'>
        <svg aria-hidden='true' />
      </Tooltip>
      <button type='button'>Outside</button>
    </div>,
  );

describe('Tooltip', () => {
  it('renders only the labelled trigger while closed', () => {
    renderTooltip();

    const trigger = screen.getByRole('button', { name: 'Backup contents' });
    expect(trigger).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it.each([
    {
      name: 'opens on hover and closes on unhover',
      open: (user: ReturnType<typeof userEvent.setup>) =>
        user.hover(screen.getByRole('button', { name: 'Backup contents' })),
      close: (user: ReturnType<typeof userEvent.setup>) =>
        user.unhover(screen.getByRole('button', { name: 'Backup contents' })),
    },
    {
      name: 'opens on keyboard focus and closes on blur',
      open: (user: ReturnType<typeof userEvent.setup>) => user.tab(),
      close: (user: ReturnType<typeof userEvent.setup>) => user.tab(),
    },
  ])('$name', async ({ open, close }) => {
    const user = userEvent.setup();
    renderTooltip();

    await open(user);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('3 words · 2 questions');
    expect(
      screen.getByRole('button', { name: 'Backup contents' }),
    ).toHaveAttribute('aria-describedby', tooltip.id);

    await close(user);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it.each([
    {
      name: 'Escape',
      dismiss: () => fireEvent.keyDown(document, { key: 'Escape' }),
    },
    {
      name: 'a mousedown outside the trigger',
      dismiss: () => fireEvent.mouseDown(screen.getByText('Outside')),
    },
    {
      name: 'a scroll anywhere on the page',
      dismiss: () => fireEvent.scroll(document.body),
    },
    {
      name: 'a window resize',
      dismiss: () => fireEvent(window, new Event('resize')),
    },
  ])('closes an open tooltip on $name', async ({ dismiss }) => {
    const user = userEvent.setup();
    renderTooltip();

    await user.hover(screen.getByRole('button', { name: 'Backup contents' }));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    dismiss();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('keeps the tooltip open on a mousedown inside the trigger', async () => {
    const user = userEvent.setup();
    renderTooltip();

    const trigger = screen.getByRole('button', { name: 'Backup contents' });
    await user.hover(trigger);
    fireEvent.mouseDown(trigger);

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('renders the panel in document.body, outside the trigger container', async () => {
    const user = userEvent.setup();
    const { container } = renderTooltip();

    await user.hover(screen.getByRole('button', { name: 'Backup contents' }));

    expect(container).not.toContainElement(screen.getByRole('tooltip'));
    expect(document.body).toContainElement(screen.getByRole('tooltip'));
  });
});
