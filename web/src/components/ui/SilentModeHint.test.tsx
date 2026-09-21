import { render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { isAppleMobileDevice } from '../../utils/platform';

import { SilentModeHint } from './SilentModeHint';

vi.mock('../../utils/platform');

const mockedIsAppleMobileDevice = isAppleMobileDevice as Mock;

describe('SilentModeHint', () => {
  it.each([
    { name: 'an Apple mobile device', isApple: true, visible: true },
    { name: 'a non-Apple device', isApple: false, visible: false },
  ])('on $name: visible=$visible', ({ isApple, visible }) => {
    mockedIsAppleMobileDevice.mockReturnValue(isApple);
    render(<SilentModeHint />);

    const hint = screen.queryByText(/silent mode/i);
    if (visible) {
      expect(hint).toBeInTheDocument();
    } else {
      expect(hint).not.toBeInTheDocument();
    }
  });
});
