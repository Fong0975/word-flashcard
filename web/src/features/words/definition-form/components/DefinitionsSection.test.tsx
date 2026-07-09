import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CambridgeDefinition } from '../types';

import { DefinitionsSection } from './DefinitionsSection';

const buildDefinition = (
  overrides: Partial<CambridgeDefinition> = {},
): CambridgeDefinition => ({
  id: 1,
  pos: 'noun',
  text: 'a fruit',
  translation: '蘋果',
  example: [],
  ...overrides,
});

describe('DefinitionsSection', () => {
  it('renders nothing when there are no definitions', () => {
    const { container } = render(
      <DefinitionsSection definitions={[]} onApplyDefinition={jest.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the part of speech, translation, and text', () => {
    render(
      <DefinitionsSection
        definitions={[buildDefinition()]}
        onApplyDefinition={jest.fn()}
      />,
    );

    expect(screen.getByText('noun')).toBeInTheDocument();
    expect(screen.getByText('蘋果')).toBeInTheDocument();
    expect(screen.getByText('a fruit')).toBeInTheDocument();
  });

  it('renders examples when present', () => {
    render(
      <DefinitionsSection
        definitions={[
          buildDefinition({
            example: [
              { id: 1, text: 'I ate an apple', translation: '我吃了一顆蘋果' },
            ],
          }),
        ]}
        onApplyDefinition={jest.fn()}
      />,
    );

    expect(screen.getByText('Examples:')).toBeInTheDocument();
    expect(screen.getByText(/I ate an apple/)).toBeInTheDocument();
  });

  it('calls onApplyDefinition with the clicked definition', async () => {
    const user = userEvent.setup();
    const onApplyDefinition = jest.fn();
    const definition = buildDefinition();
    render(
      <DefinitionsSection
        definitions={[definition]}
        onApplyDefinition={onApplyDefinition}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApplyDefinition).toHaveBeenCalledWith(definition);
  });
});
