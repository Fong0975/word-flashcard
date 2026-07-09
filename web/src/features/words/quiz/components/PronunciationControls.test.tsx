import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { speakText } from '../../../shared/speech';

import { PronunciationControls } from './PronunciationControls';

jest.mock('../../../shared/speech');

const mockedSpeakText = speakText as jest.Mock;

describe('PronunciationControls', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders a playable UK button when a UK url is available', () => {
    render(
      <PronunciationControls
        word='apple'
        pronunciationUrls={{ uk: 'uk.mp3' }}
        hasUkUrl
        hasUsUrl={false}
      />,
    );

    expect(screen.getByText('UK')).toBeInTheDocument();
  });

  it('falls back to speech synthesis for UK when there is no UK url', async () => {
    const user = userEvent.setup();
    render(
      <PronunciationControls
        word='apple'
        pronunciationUrls={{}}
        hasUkUrl={false}
        hasUsUrl={false}
      />,
    );

    await user.click(screen.getByTitle('British pronunciation'));
    expect(mockedSpeakText).toHaveBeenCalledWith('apple', 'en-GB');
  });

  it('falls back to speech synthesis for US when there is no US url', async () => {
    const user = userEvent.setup();
    render(
      <PronunciationControls
        word='apple'
        pronunciationUrls={{}}
        hasUkUrl={false}
        hasUsUrl={false}
      />,
    );

    await user.click(screen.getByTitle('American pronunciation'));
    expect(mockedSpeakText).toHaveBeenCalledWith('apple', 'en-US');
  });

  it('renders a playable US button when a US url is available', () => {
    render(
      <PronunciationControls
        word='apple'
        pronunciationUrls={{ us: 'us.mp3' }}
        hasUkUrl={false}
        hasUsUrl
      />,
    );

    expect(screen.getByText('US')).toBeInTheDocument();
  });
});
