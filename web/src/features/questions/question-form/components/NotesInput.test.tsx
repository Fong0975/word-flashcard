import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NotesInput } from './NotesInput';

describe('NotesInput', () => {
  it('associates the label with the editor field', () => {
    render(<NotesInput value='' onChange={jest.fn()} />);
    expect(screen.getByLabelText('Explanation / Notes')).toBeInTheDocument();
  });

  it('calls onChange as the user types', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<NotesInput value='' onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('disables the field when disabled is set', () => {
    render(<NotesInput value='' onChange={jest.fn()} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders template buttons and forwards selections', async () => {
    const user = userEvent.setup();
    const onAppendTemplate = jest.fn();
    render(
      <NotesInput
        value=''
        onChange={jest.fn()}
        templateButtons={[{ label: 'Divider', value: '---' }]}
        onAppendTemplate={onAppendTemplate}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Divider' }));
    expect(onAppendTemplate).toHaveBeenCalledWith('---');
  });
});
