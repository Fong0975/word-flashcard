import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { useAudio, UseAudioReturn } from '../../hooks/useAudio';

import { PronunciationButton } from './PronunciationButton';

vi.mock('../../hooks/useAudio');

const mockedUseAudio = useAudio as Mock;

const buildHookReturn = (
  overrides: Partial<UseAudioReturn> = {},
): UseAudioReturn => ({
  isPlaying: false,
  isLoading: false,
  error: null,
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  stop: vi.fn(),
  ...overrides,
});

describe('PronunciationButton', () => {
  beforeEach(() => {
    mockedUseAudio.mockReturnValue(buildHookReturn());
  });

  it('renders the UK accent label', () => {
    render(<PronunciationButton audioUrl='uk.mp3' accent='uk' />);
    expect(screen.getByText('UK')).toBeInTheDocument();
  });

  it('renders the US accent label', () => {
    render(<PronunciationButton audioUrl='us.mp3' accent='us' />);
    expect(screen.getByText('US')).toBeInTheDocument();
  });

  it('plays the given audio url when clicked', async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    mockedUseAudio.mockReturnValue(buildHookReturn({ play }));
    const user = userEvent.setup();
    render(<PronunciationButton audioUrl='uk.mp3' accent='uk' />);

    await user.click(screen.getByRole('button'));

    expect(play).toHaveBeenCalledWith('uk.mp3');
  });

  it('is disabled when there is no audio url', () => {
    render(<PronunciationButton audioUrl='' accent='uk' />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when the disabled prop is set', () => {
    render(<PronunciationButton audioUrl='uk.mp3' accent='uk' disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled while audio is loading', () => {
    mockedUseAudio.mockReturnValue(buildHookReturn({ isLoading: true }));
    render(<PronunciationButton audioUrl='uk.mp3' accent='uk' />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call play when disabled', async () => {
    const play = vi.fn();
    mockedUseAudio.mockReturnValue(buildHookReturn({ play }));
    const user = userEvent.setup();
    render(<PronunciationButton audioUrl='uk.mp3' accent='uk' disabled />);

    await user.click(screen.getByRole('button'));
    expect(play).not.toHaveBeenCalled();
  });
});
