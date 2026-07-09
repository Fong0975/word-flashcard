import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DictionaryLookupHeader } from './DictionaryLookupHeader';

describe('DictionaryLookupHeader', () => {
  it('calls onFetchDictionary when the fetch button is clicked', async () => {
    const user = userEvent.setup();
    const onFetchDictionary = jest.fn();
    render(
      <DictionaryLookupHeader
        isLoadingDictionary={false}
        isCollapsed={false}
        onFetchDictionary={onFetchDictionary}
        onToggleCollapsed={jest.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Fetch Definition' }));
    expect(onFetchDictionary).toHaveBeenCalledTimes(1);
  });

  it('disables the fetch button and shows a loading label while loading', () => {
    render(
      <DictionaryLookupHeader
        isLoadingDictionary
        isCollapsed={false}
        onFetchDictionary={jest.fn()}
        onToggleCollapsed={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Loading/ })).toBeDisabled();
  });

  it('calls onToggleCollapsed when the toggle button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleCollapsed = jest.fn();
    render(
      <DictionaryLookupHeader
        isLoadingDictionary={false}
        isCollapsed
        onFetchDictionary={jest.fn()}
        onToggleCollapsed={onToggleCollapsed}
      />,
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]);
    expect(onToggleCollapsed).toHaveBeenCalledTimes(1);
  });
});
