import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TemplateButton } from '../../types/components';

import { TemplateButtonRow } from './TemplateButtonRow';

const buildButtons = (): TemplateButton[] => [
  { label: 'Alert', value: '> [!NOTE]' },
  { label: 'Divider', value: '---' },
];

describe('TemplateButtonRow', () => {
  it('renders nothing when there are no buttons', () => {
    const { container } = render(
      <TemplateButtonRow buttons={[]} onSelect={jest.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a button per template and the default helper text', () => {
    render(<TemplateButtonRow buttons={buildButtons()} onSelect={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Alert' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Divider' })).toBeInTheDocument();
    expect(
      screen.getByText('Click buttons above to quickly add note templates'),
    ).toBeInTheDocument();
  });

  it('calls onSelect with the template value when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<TemplateButtonRow buttons={buildButtons()} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Alert' }));
    expect(onSelect).toHaveBeenCalledWith('> [!NOTE]');
  });

  it('disables every button when disabled is set', () => {
    render(
      <TemplateButtonRow
        buttons={buildButtons()}
        onSelect={jest.fn()}
        disabled
      />,
    );

    expect(screen.getByRole('button', { name: 'Alert' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Divider' })).toBeDisabled();
  });

  it('renders a custom helper text', () => {
    render(
      <TemplateButtonRow
        buttons={buildButtons()}
        onSelect={jest.fn()}
        helperText='Custom helper'
      />,
    );
    expect(screen.getByText('Custom helper')).toBeInTheDocument();
  });
});
