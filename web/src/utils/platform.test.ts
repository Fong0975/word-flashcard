import { isAppleMobileDevice } from './platform';

describe('isAppleMobileDevice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints;
  });

  it.each([
    {
      name: 'iPhone',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      maxTouchPoints: 5,
      expected: true,
    },
    {
      name: 'iPad with an iPad user agent',
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      maxTouchPoints: 5,
      expected: true,
    },
    {
      name: 'iPadOS in desktop mode (Macintosh user agent with touch)',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
      maxTouchPoints: 5,
      expected: true,
    },
    {
      name: 'macOS without touch support',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
      maxTouchPoints: 0,
      expected: false,
    },
    {
      name: 'Windows',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
      maxTouchPoints: 0,
      expected: false,
    },
    {
      name: 'Android',
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120.0',
      maxTouchPoints: 5,
      expected: false,
    },
  ])(
    'returns $expected for $name',
    ({ userAgent, maxTouchPoints, expected }) => {
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
      // jsdom does not implement maxTouchPoints, so it cannot be spied on.
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: maxTouchPoints,
        configurable: true,
      });

      expect(isAppleMobileDevice()).toBe(expected);
    },
  );
});
