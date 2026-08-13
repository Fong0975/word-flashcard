const registerSWMock = vi.fn();

vi.mock('virtual:pwa-register', () => ({
  registerSW: registerSWMock,
}));

describe('registerServiceWorker', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    registerSWMock.mockClear();
  });

  const tests = [
    {
      name: 'registers the service worker in production builds',
      isProd: true,
      expectRegistered: true,
    },
    {
      name: 'does not register the service worker outside production builds',
      isProd: false,
      expectRegistered: false,
    },
  ];

  it.each(tests)('$name', async ({ isProd, expectRegistered }) => {
    vi.stubEnv('PROD', isProd);

    const { registerServiceWorker } = await import('./registerServiceWorker');
    registerServiceWorker();

    if (expectRegistered) {
      expect(registerSWMock).toHaveBeenCalledWith({ immediate: true });
    } else {
      expect(registerSWMock).not.toHaveBeenCalled();
    }
  });
});
