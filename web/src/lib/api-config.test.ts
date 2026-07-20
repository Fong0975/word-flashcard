export {};

describe('API_CONFIG', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('falls back to localhost and the default ports when no env vars are set', () => {
    delete process.env.REACT_APP_API_HOSTNAME;
    delete process.env.REACT_APP_API_PORT;
    delete process.env.REACT_APP_API_HOSTNAME_DICTIONARY;
    delete process.env.REACT_APP_API_PORT_DICTIONARY;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { API_CONFIG } = require('./api-config');

    expect(API_CONFIG.baseURL).toBe('http://localhost:8080/api');
    expect(API_CONFIG.dictionaryBaseURL).toBe('http://localhost:8081/api');
  });

  it('builds the base URLs from the configured env vars when set', () => {
    process.env.REACT_APP_API_HOSTNAME = 'api.example.com';
    process.env.REACT_APP_API_PORT = '9000';
    process.env.REACT_APP_API_HOSTNAME_DICTIONARY = 'dict.example.com';
    process.env.REACT_APP_API_PORT_DICTIONARY = '9001';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { API_CONFIG } = require('./api-config');

    expect(API_CONFIG.baseURL).toBe('http://api.example.com:9000/api');
    expect(API_CONFIG.dictionaryBaseURL).toBe(
      'http://dict.example.com:9001/api',
    );
  });
});

describe('API_ENDPOINTS', () => {
  it('builds parameterized endpoint paths from the given ids', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { API_ENDPOINTS } = require('./api-config');

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
  it('URL-encodes spaces and special characters in the looked-up word', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DICTIONARY_ENDPOINTS } = require('./api-config');

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
