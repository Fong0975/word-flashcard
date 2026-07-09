import { render } from '@testing-library/react';

import { FamiliarityLevel } from '../../../../types/base';

import { FamiliarityBar } from './FamiliarityBar';

describe('FamiliarityBar', () => {
  it('renders nothing when there is no familiarity', () => {
    const { container } = render(<FamiliarityBar familiarity='' />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a bar when a familiarity level is given', () => {
    const { container } = render(
      <FamiliarityBar familiarity={FamiliarityLevel.GREEN} />,
    );
    expect(container).not.toBeEmptyDOMElement();
  });
});
