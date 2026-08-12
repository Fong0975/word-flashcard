export {};

describe('API_CONFIG', () => {
  const ORIGINAL_ENV = { ...import.meta.env };

  beforeEach(() => {
    vi.resetModules();
    Object.assign(import.meta.env, ORIGINAL_ENV);
  });

  afterAll(() => {
    Object.assign(import.meta.env, ORIGINAL_ENV);
  });

  it('falls back to localhost and the default ports when no env vars are set', async () => {
    delete (import.meta.env as Record<string, string | undefined>)
      .VITE_API_HOSTNAME;
    delete (import.meta.env as Record<string, string | undefined>)
      .VITE_API_PORT;
    delete (import.meta.env as Record<string, string | undefined>)
      .VITE_API_HOSTNAME_DICTIONARY;
    delete (import.meta.env as Record<string, string | undefined>)
      .VITE_API_PORT_DICTIONARY;

    const { API_CONFIG } = await import('./api-config');

    expect(API_CONFIG.baseURL).toBe('http://localhost:8080/api');
    expect(API_CONFIG.dictionaryBaseURL).toBe('http://localhost:8081/api');
  });

  it('builds the base URLs from the configured env vars when set', async () => {
    (import.meta.env as Record<string, string>).VITE_API_HOSTNAME =
      'api.example.com';
    (import.meta.env as Record<string, string>).VITE_API_PORT = '9000';
    (import.meta.env as Record<string, string>).VITE_API_HOSTNAME_DICTIONARY =
      'dict.example.com';
    (import.meta.env as Record<string, string>).VITE_API_PORT_DICTIONARY =
      '9001';

    const { API_CONFIG } = await import('./api-config');

    expect(API_CONFIG.baseURL).toBe('http://api.example.com:9000/api');
    expect(API_CONFIG.dictionaryBaseURL).toBe(
      'http://dict.example.com:9001/api',
    );
  });
});

describe('API_ENDPOINTS', () => {
  it('builds parameterized endpoint paths from the given ids', async () => {
    const { API_ENDPOINTS } = await import('./api-config');

    expect(API_ENDPOINTS.wordDefinition(5)).toBe('/words/definition/5');
    expect(API_ENDPOINTS.updateDefinition(5)).toBe('/words/definition/5');
    expect(API_ENDPOINTS.deleteDefinition(5)).toBe('/words/definition/5');
    expect(API_ENDPOINTS.wordLogs(5)).toBe('/words/5/logs');
    expect(API_ENDPOINTS.questionById(5)).toBe('/questions/5');
    expect(API_ENDPOINTS.questionLogs(5)).toBe('/questions/5/logs');
    expect(API_ENDPOINTS.noteById(5)).toBe('/notes/5');
  });
});

describe('DICTIONARY_ENDPOINTS', () => {
  it('URL-encodes spaces and special characters in the looked-up word', async () => {
    const { DICTIONARY_ENDPOINTS } = await import('./api-config');

    // encodeURIComponent leaves apostrophes untouched (they're in its
    // unreserved set) but must escape a literal slash so it isn't mistaken
    // for a path separator.
    expect(DICTIONARY_ENDPOINTS.lookup("don't")).toBe(
      "/dictionary/en-tw/don't",
    );
    expect(DICTIONARY_ENDPOINTS.lookup('a/b')).toBe('/dictionary/en-tw/a%2Fb');
    expect(DICTIONARY_ENDPOINTS.lookup('ice cream')).toBe(
      '/dictionary/en-tw/ice%20cream',
    );
  });
});
