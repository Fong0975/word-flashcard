import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CambridgePronunciation } from '../types';

import { PronunciationSection } from './PronunciationSection';

const buildPronunciation = (
  overrides: Partial<CambridgePronunciation> = {},
): CambridgePronunciation => ({
  pos: 'noun',
  lang: 'uk',
  url: 'http://example.com/uk.mp3',
  pron: '/wɜːd/',
  ...overrides,
});

describe('PronunciationSection', () => {
  it('renders nothing when there are no pronunciations', () => {
    const { container } = render(
      <PronunciationSection
        pronunciations={[]}
        onApplyPronunciation={jest.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders both accents when both are available', () => {
    render(
      <PronunciationSection
        pronunciations={[
          buildPronunciation({ lang: 'uk' }),
          buildPronunciation({ lang: 'us', url: 'http://example.com/us.mp3' }),
        ]}
        onApplyPronunciation={jest.fn()}
      />,
    );

    expect(screen.getByText('UK:')).toBeInTheDocument();
    expect(screen.getByText('US:')).toBeInTheDocument();
    expect(
      screen.queryByText(/pronunciation not available/),
    ).not.toBeInTheDocument();
  });

  it('notes when only one accent is available', () => {
    render(
      <PronunciationSection
        pronunciations={[buildPronunciation({ lang: 'uk' })]}
        onApplyPronunciation={jest.fn()}
      />,
    );

    expect(
      screen.getByText('US pronunciation not available'),
    ).toBeInTheDocument();
  });

  it('calls onApplyPronunciation with the group urls and part of speech', async () => {
    const user = userEvent.setup();
    const onApplyPronunciation = jest.fn();
    render(
      <PronunciationSection
        pronunciations={[
          buildPronunciation({
            pos: 'noun',
            lang: 'uk',
            url: 'http://example.com/uk.mp3',
          }),
          buildPronunciation({
            pos: 'noun',
            lang: 'us',
            url: 'http://example.com/us.mp3',
          }),
        ]}
        onApplyPronunciation={onApplyPronunciation}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApplyPronunciation).toHaveBeenCalledWith(
      'http://example.com/uk.mp3',
      'http://example.com/us.mp3',
      'noun',
    );
  });

  it('disables Apply when neither accent has a url', () => {
    render(
      <PronunciationSection
        pronunciations={[buildPronunciation({ url: '' })]}
        onApplyPronunciation={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });
});
