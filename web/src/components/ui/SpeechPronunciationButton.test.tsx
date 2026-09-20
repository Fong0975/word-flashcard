import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { speakText } from '../../features/shared/speech';

import { SpeechPronunciationButton } from './SpeechPronunciationButton';

vi.mock('../../features/shared/speech');

const mockedSpeakText = speakText as Mock;

describe('SpeechPronunciationButton', () => {
  beforeEach(() => {
    mockedSpeakText.mockReset();
    mockedSpeakText.mockReturnValue(true);
  });

  it.each([
    {
      accent: 'uk',
      title: 'British pronunciation',
      label: 'UK',
      locale: 'en-GB',
    },
    {
      accent: 'us',
      title: 'American pronunciation',
      label: 'US',
      locale: 'en-US',
    },
  ] as const)(
    'renders the $accent button and speaks with $locale',
    async ({ accent, title, label, locale }) => {
      const user = userEvent.setup();
      render(<SpeechPronunciationButton text='apple' accent={accent} />);

      expect(screen.getByText(label)).toBeInTheDocument();
      await user.click(screen.getByTitle(title));

      expect(mockedSpeakText).toHaveBeenCalledWith(
        'apple',
        locale,
        expect.any(Function),
      );
    },
  );

  it('shows a playing state while speaking and restores it when finished', async () => {
    const user = userEvent.setup();
    render(<SpeechPronunciationButton text='apple' accent='uk' />);
    const button = screen.getByTitle('British pronunciation');

    expect(button).toHaveAttribute('aria-busy', 'false');
    expect(screen.queryByTestId('speech-playing-icon')).not.toBeInTheDocument();

    await user.click(button);

    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('speech-playing-icon')).toBeInTheDocument();
    expect(screen.getByText('UK…')).toBeInTheDocument();

    act(() => mockedSpeakText.mock.calls[0][2]());

    expect(button).toHaveAttribute('aria-busy', 'false');
    expect(screen.queryByTestId('speech-playing-icon')).not.toBeInTheDocument();
    expect(screen.getByText('UK')).toBeInTheDocument();
  });

  it('does not show the playing state when speech is unavailable', async () => {
    mockedSpeakText.mockReturnValue(false);
    const user = userEvent.setup();
    render(<SpeechPronunciationButton text='apple' accent='us' />);

    await user.click(screen.getByTitle('American pronunciation'));

    expect(screen.queryByTestId('speech-playing-icon')).not.toBeInTheDocument();
  });
});
