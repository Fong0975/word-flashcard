import { render, screen } from '@testing-library/react';

import { QuizLoadingScreen } from './QuizLoadingScreen';

describe('QuizLoadingScreen', () => {
  it('renders the loading message', () => {
    render(<QuizLoadingScreen />);
    expect(screen.getByText('Loading Quiz')).toBeInTheDocument();
    expect(
      screen.getByText('Preparing your quiz questions...'),
    ).toBeInTheDocument();
  });
});
