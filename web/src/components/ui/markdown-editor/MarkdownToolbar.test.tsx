import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MarkdownToolbar } from './MarkdownToolbar';

describe('MarkdownToolbar', () => {
  it('renders every format button and the Edit/Preview toggle', () => {
    render(
      <MarkdownToolbar
        onFormat={jest.fn()}
        isPreview={false}
        onTogglePreview={jest.fn()}
      />,
    );

    [
      'Bold',
      'Italic',
      'Underline',
      'Quote',
      'Code',
      'Link',
      'Bullet List',
      'Numbered List',
    ].forEach(label => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
  });

  it('calls onFormat with the clicked action', async () => {
    const user = userEvent.setup();
    const onFormat = jest.fn();
    render(
      <MarkdownToolbar
        onFormat={onFormat}
        isPreview={false}
        onTogglePreview={jest.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(onFormat).toHaveBeenCalledWith('bold');

    await user.click(screen.getByRole('button', { name: 'Bullet List' }));
    expect(onFormat).toHaveBeenCalledWith('bulletList');
  });

  it('disables format buttons while disabled or in preview mode', () => {
    render(
      <MarkdownToolbar
        onFormat={jest.fn()}
        disabled
        isPreview={false}
        onTogglePreview={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled();
  });

  it('disables format buttons in preview mode even when not otherwise disabled', () => {
    render(
      <MarkdownToolbar
        onFormat={jest.fn()}
        isPreview
        onTogglePreview={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled();
  });

  it('does not disable the Edit/Preview toggle itself', () => {
    render(
      <MarkdownToolbar
        onFormat={jest.fn()}
        disabled
        isPreview
        onTogglePreview={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Edit' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Preview' })).not.toBeDisabled();
  });

  it('toggles preview mode when Edit/Preview is clicked', async () => {
    const user = userEvent.setup();
    const onTogglePreview = jest.fn();
    render(
      <MarkdownToolbar
        onFormat={jest.fn()}
        isPreview={false}
        onTogglePreview={onTogglePreview}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(onTogglePreview).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onTogglePreview).toHaveBeenCalledWith(false);
  });
});
