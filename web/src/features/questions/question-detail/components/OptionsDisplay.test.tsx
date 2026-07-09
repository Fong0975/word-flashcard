import { render, screen } from '@testing-library/react';

import { OptionsDisplay } from './OptionsDisplay';

describe('OptionsDisplay', () => {
  it('renders a heading and an item per option', () => {
    render(
      <OptionsDisplay
        options={[
          { key: 'A', value: '4' },
          { key: 'B', value: '3' },
        ]}
      />,
    );

    expect(screen.getByText('Options')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
