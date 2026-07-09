import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AddDefinitionButton } from './AddDefinitionButton';

describe('AddDefinitionButton', () => {
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<AddDefinitionButton onClick={onClick} />);

    await user.click(screen.getByTitle('Add new definition'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
