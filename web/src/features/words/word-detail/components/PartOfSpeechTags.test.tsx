import { render, screen } from '@testing-library/react';

import { PartOfSpeechTags } from './PartOfSpeechTags';

describe('PartOfSpeechTags', () => {
  it('renders nothing when there is no part of speech', () => {
    const { container } = render(<PartOfSpeechTags partOfSpeech='' />);
    expect(container).toBeEmptyDOMElement();
  });

  it('splits a comma-separated list into individual tags', () => {
    render(<PartOfSpeechTags partOfSpeech='noun, verb' />);
    expect(screen.getByText('noun')).toBeInTheDocument();
    expect(screen.getByText('verb')).toBeInTheDocument();
  });

  it('filters out blank segments', () => {
    render(<PartOfSpeechTags partOfSpeech='noun,, verb' />);
    expect(screen.getAllByText(/noun|verb/)).toHaveLength(2);
  });
});
