import { render, screen } from '@testing-library/react';

import { OptionItem } from './OptionItem';

describe('OptionItem', () => {
  it('renders the option key and value', () => {
    render(<OptionItem option={{ key: 'A', value: '4' }} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
