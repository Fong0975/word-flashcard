import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TotalCountLabel } from './TotalCountLabel';

describe('TotalCountLabel', () => {
  it('renders nothing when the total count is zero', () => {
    const { container } = render(
      <TotalCountLabel totalCount={0} entityLabel='words' />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the count as plain text when there is no click handler', () => {
    render(<TotalCountLabel totalCount={3} entityLabel='words' />);

    expect(screen.getByText('3 words total')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the count as a clickable button when a click handler is given', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <TotalCountLabel totalCount={1} entityLabel='note' onClick={onClick} />,
    );

    await user.click(screen.getByRole('button', { name: '1 note total' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
