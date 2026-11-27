import { render, screen, fireEvent } from '@testing-library/react';

import { SectionedModal } from './SectionedModal';

describe('SectionedModal', () => {
  const renderModal = (onClose = vi.fn()) =>
    render(
      <SectionedModal
        isOpen
        onClose={onClose}
        header={<h2>Header content</h2>}
        footer={<button type='button'>Footer action</button>}
        overlays={<p>Overlay content</p>}
      >
        <p>Body content</p>
      </SectionedModal>,
    );

  it('renders every section and the overlays', () => {
    renderModal();

    ['Header content', 'Body content', 'Footer action', 'Overlay content']
      .map(text => screen.getByText(text))
      .forEach(element => expect(element).toBeInTheDocument());
  });

  it('makes only the body scrollable', () => {
    renderModal();

    expect(screen.getByText('Body content').parentElement).toHaveClass(
      'overflow-y-auto',
    );
    expect(screen.getByText('Header content').parentElement).not.toHaveClass(
      'overflow-y-auto',
    );
  });

  it('clips the panel without making it a scroll container', () => {
    renderModal();

    const panel = screen
      .getByText('Body content')
      .closest('.glass-panel-strong');
    expect(panel).toHaveClass('overflow-clip');
    expect(panel).not.toHaveClass('overflow-hidden');
  });

  it('forwards Modal props', () => {
    const onClose = vi.fn();
    renderModal(onClose);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
