import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CambridgeApiResponse } from '../types';

import { DictionaryLookup } from './DictionaryLookup';

const buildResponse = (
  overrides: Partial<CambridgeApiResponse> = {},
): CambridgeApiResponse => ({
  word: 'apple',
  pos: ['noun'],
  verbs: [],
  pronunciation: [],
  definition: [],
  ...overrides,
});

describe('DictionaryLookup', () => {
  it('renders nothing without a word', () => {
    const { container } = render(
      <DictionaryLookup
        wordText={null}
        dictionaryData={null}
        isLoadingDictionary={false}
        dictionaryError={null}
        isCollapsed={false}
        onFetchDictionary={jest.fn()}
        onToggleCollapsed={jest.fn()}
        onApplyPronunciation={jest.fn()}
        onApplyDefinition={jest.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows only the header while collapsed', () => {
    render(
      <DictionaryLookup
        wordText='apple'
        dictionaryData={null}
        isLoadingDictionary={false}
        dictionaryError={null}
        isCollapsed
        onFetchDictionary={jest.fn()}
        onToggleCollapsed={jest.fn()}
        onApplyPronunciation={jest.fn()}
        onApplyDefinition={jest.fn()}
      />,
    );

    expect(screen.getByText('Dictionary Lookup')).toBeInTheDocument();
    expect(
      screen.queryByText('No dictionary data available.'),
    ).not.toBeInTheDocument();
  });

  it('shows the error message when expanded with an error', () => {
    render(
      <DictionaryLookup
        wordText='apple'
        dictionaryData={null}
        isLoadingDictionary={false}
        dictionaryError='Failed to fetch dictionary data'
        isCollapsed={false}
        onFetchDictionary={jest.fn()}
        onToggleCollapsed={jest.fn()}
        onApplyPronunciation={jest.fn()}
        onApplyDefinition={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Failed to fetch dictionary data'),
    ).toBeInTheDocument();
  });

  it('shows an empty state when expanded with no data and no error', () => {
    render(
      <DictionaryLookup
        wordText='apple'
        dictionaryData={null}
        isLoadingDictionary={false}
        dictionaryError={null}
        isCollapsed={false}
        onFetchDictionary={jest.fn()}
        onToggleCollapsed={jest.fn()}
        onApplyPronunciation={jest.fn()}
        onApplyDefinition={jest.fn()}
      />,
    );

    expect(
      screen.getByText('No dictionary data available.'),
    ).toBeInTheDocument();
  });

  it('renders the dictionary data sections when available', () => {
    render(
      <DictionaryLookup
        wordText='apple'
        dictionaryData={buildResponse({
          definition: [
            {
              id: 1,
              pos: 'noun',
              text: 'a fruit',
              translation: '蘋果',
              example: [],
            },
          ],
        })}
        isLoadingDictionary={false}
        dictionaryError={null}
        isCollapsed={false}
        onFetchDictionary={jest.fn()}
        onToggleCollapsed={jest.fn()}
        onApplyPronunciation={jest.fn()}
        onApplyDefinition={jest.fn()}
      />,
    );

    expect(screen.getByText('Definitions')).toBeInTheDocument();
    expect(screen.getByText('a fruit')).toBeInTheDocument();
  });

  it('calls onFetchDictionary when the fetch button is clicked', async () => {
    const user = userEvent.setup();
    const onFetchDictionary = jest.fn();
    render(
      <DictionaryLookup
        wordText='apple'
        dictionaryData={null}
        isLoadingDictionary={false}
        dictionaryError={null}
        isCollapsed={false}
        onFetchDictionary={onFetchDictionary}
        onToggleCollapsed={jest.fn()}
        onApplyPronunciation={jest.fn()}
        onApplyDefinition={jest.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Fetch Definition' }));
    expect(onFetchDictionary).toHaveBeenCalledTimes(1);
  });
});
