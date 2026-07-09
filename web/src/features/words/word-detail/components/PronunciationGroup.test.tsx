import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { speakText } from '../../../shared/speech';

import { PronunciationGroup } from './PronunciationGroup';

jest.mock('../../../shared/speech');

const mockedSpeakText = speakText as jest.Mock;

describe('PronunciationGroup', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when there is no audio and no speech fallback', () => {
    const { container } = render(<PronunciationGroup phonetics={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a playable button when a valid UK audio url is present', () => {
    render(
      <PronunciationGroup phonetics={{ uk: 'http://example.com/uk.mp3' }} />,
    );
    expect(screen.getByText('UK')).toBeInTheDocument();
  });

  it('falls back to a speech button when there is no UK audio but a fallback is provided', async () => {
    const user = userEvent.setup();
    render(
      <PronunciationGroup
        phonetics={{}}
        speechFallback={{ wordText: 'apple', uk: true, us: false }}
      />,
    );

    const button = screen.getByTitle('British pronunciation');
    await user.click(button);
    expect(mockedSpeakText).toHaveBeenCalledWith('apple', 'en-GB');
  });

  it('renders nothing for UK when there is no audio and no fallback requested', () => {
    render(
      <PronunciationGroup
        phonetics={{}}
        speechFallback={{ wordText: 'apple', uk: false, us: false }}
      />,
    );
    expect(
      screen.queryByTitle('British pronunciation'),
    ).not.toBeInTheDocument();
  });

  it('falls back to a speech button for US when requested', async () => {
    const user = userEvent.setup();
    render(
      <PronunciationGroup
        phonetics={{}}
        speechFallback={{ wordText: 'apple', uk: false, us: true }}
      />,
    );

    await user.click(screen.getByTitle('American pronunciation'));
    expect(mockedSpeakText).toHaveBeenCalledWith('apple', 'en-US');
  });
});
