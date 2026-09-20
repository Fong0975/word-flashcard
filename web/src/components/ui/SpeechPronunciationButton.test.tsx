import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { speakText } from '../../features/shared/speech';
import { isAppleMobileDevice } from '../../utils/platform';

import { SpeechPronunciationButton } from './SpeechPronunciationButton';

vi.mock('../../features/shared/speech');
vi.mock('../../utils/platform');

const mockedSpeakText = speakText as Mock;
const mockedIsAppleMobileDevice = isAppleMobileDevice as Mock;

describe('SpeechPronunciationButton', () => {
  beforeEach(() => {
    mockedSpeakText.mockReset();
    mockedSpeakText.mockReturnValue(true);
    mockedIsAppleMobileDevice.mockReset();
    mockedIsAppleMobileDevice.mockReturnValue(false);
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

  it.each([
    { name: 'focused', isApple: true, action: 'focus', visible: true },
    { name: 'clicked', isApple: true, action: 'click', visible: true },
    {
      name: 'focused on a non-Apple device',
      isApple: false,
      action: 'focus',
      visible: false,
    },
    {
      name: 'clicked on a non-Apple device',
      isApple: false,
      action: 'click',
      visible: false,
    },
  ] as const)(
    'silent mode tooltip when $name: visible=$visible',
    async ({ isApple, action, visible }) => {
      mockedIsAppleMobileDevice.mockReturnValue(isApple);
      const user = userEvent.setup();
      render(<SpeechPronunciationButton text='apple' accent='uk' />);
      const button = screen.getByTitle('British pronunciation');

      if (action === 'focus') {
        act(() => button.focus());
      } else {
        await user.click(button);
      }

      const tooltip = screen.queryByRole('tooltip');
      if (visible) {
        expect(tooltip).toHaveTextContent(/silent mode/i);
        expect(button).toHaveAttribute('aria-describedby', tooltip!.id);
      } else {
        expect(tooltip).not.toBeInTheDocument();
        expect(button).not.toHaveAttribute('aria-describedby');
      }
    },
  );

  it('hides the tooltip when the button loses focus', () => {
    mockedIsAppleMobileDevice.mockReturnValue(true);
    render(<SpeechPronunciationButton text='apple' accent='uk' />);
    const button = screen.getByTitle('British pronunciation');

    act(() => button.focus());
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    act(() => button.blur());
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows only one tooltip when two buttons are clicked in a row', async () => {
    mockedIsAppleMobileDevice.mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <>
        <SpeechPronunciationButton text='apple' accent='uk' />
        <SpeechPronunciationButton text='apple' accent='us' />
      </>,
    );
    const ukButton = screen.getByTitle('British pronunciation');
    const usButton = screen.getByTitle('American pronunciation');

    await user.click(ukButton);
    expect(screen.getAllByRole('tooltip')).toHaveLength(1);
    expect(ukButton).toHaveAttribute('aria-describedby');

    await user.click(usButton);
    expect(screen.getAllByRole('tooltip')).toHaveLength(1);
    expect(ukButton).not.toHaveAttribute('aria-describedby');
    expect(usButton).toHaveAttribute('aria-describedby');
  });

  it('does not show the playing state when speech is unavailable', async () => {
    mockedSpeakText.mockReturnValue(false);
    const user = userEvent.setup();
    render(<SpeechPronunciationButton text='apple' accent='us' />);

    await user.click(screen.getByTitle('American pronunciation'));

    expect(screen.queryByTestId('speech-playing-icon')).not.toBeInTheDocument();
  });
});
