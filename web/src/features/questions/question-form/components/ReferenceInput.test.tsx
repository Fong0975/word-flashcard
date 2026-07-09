import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReferenceInput } from './ReferenceInput';

describe('ReferenceInput', () => {
  it('renders the current value', () => {
    render(<ReferenceInput value='p.12' onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('p.12');
  });

  it('calls onChange as the user types', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ReferenceInput value='' onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('does not render template buttons without onSelectTemplate', () => {
    render(
      <ReferenceInput
        value=''
        onChange={jest.fn()}
        templateButtons={[{ label: 'Book', value: 'Textbook p.' }]}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Book' }),
    ).not.toBeInTheDocument();
  });

  it('renders template buttons and forwards selections when onSelectTemplate is provided', async () => {
    const user = userEvent.setup();
    const onSelectTemplate = jest.fn();
    render(
      <ReferenceInput
        value=''
        onChange={jest.fn()}
        templateButtons={[{ label: 'Book', value: 'Textbook p.' }]}
        onSelectTemplate={onSelectTemplate}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Book' }));
    expect(onSelectTemplate).toHaveBeenCalledWith('Textbook p.');
  });

  it('disables the input when disabled is set', () => {
    render(<ReferenceInput value='' onChange={jest.fn()} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
