import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Modal } from './Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={jest.fn()}>
        Content
      </Modal>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the title and children when open', () => {
    render(
      <Modal isOpen onClose={jest.fn()} title='Edit Word'>
        <p>Body content</p>
      </Modal>,
    );

    expect(
      screen.getByRole('heading', { name: 'Edit Word' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title='Edit Word'>
        Body
      </Modal>,
    );

    await user.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the backdrop', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        Body
      </Modal>,
    );

    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking the backdrop with disableBackdropClose set', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} disableBackdropClose>
        Body
      </Modal>,
    );

    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        Body
      </Modal>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape with disableEscapeClose set', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} disableEscapeClose>
        Body
      </Modal>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not close when clicking inside the modal content', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Body content</p>
      </Modal>,
    );

    await user.click(screen.getByText('Body content'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
