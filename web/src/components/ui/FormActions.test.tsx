import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FormActions } from './FormActions';

describe('FormActions', () => {
  it('shows "Add" wording in create mode', () => {
    render(
      <FormActions
        mode='create'
        entityLabel='Word'
        isSubmitting={false}
        isFormValid
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Add Word' }),
    ).toBeInTheDocument();
  });

  it('shows "Update" wording in edit mode', () => {
    render(
      <FormActions
        mode='edit'
        entityLabel='Word'
        isSubmitting={false}
        isFormValid
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Update Word' }),
    ).toBeInTheDocument();
  });

  it('shows loading text and disables both buttons while submitting', () => {
    render(
      <FormActions
        mode='create'
        entityLabel='Word'
        isSubmitting
        isFormValid
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.getByText('Adding...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Adding/ })).toBeDisabled();
  });

  it('disables the submit button when the form is invalid', () => {
    render(
      <FormActions
        mode='create'
        entityLabel='Word'
        isSubmitting={false}
        isFormValid={false}
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Add Word' })).toBeDisabled();
  });

  it('calls onCancel and onSubmit when clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    const onSubmit = jest.fn();
    render(
      <FormActions
        mode='create'
        entityLabel='Word'
        isSubmitting={false}
        isFormValid
        onCancel={onCancel}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Add Word' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
