import { apiService } from './api';
import { API_CONFIG, API_ENDPOINTS } from './api-config';
import { buildMockResponse } from './apiTestHelpers';

describe('ApiService - notes', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  describe('searchNotes', () => {
    it('builds the query string from limit/offset only, never forwarding sort', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse([]));

      await apiService.searchNotes({ limit: 10, offset: 0, sort: 'title' });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.notesSearch}?limit=10&offset=0`,
      );
    });

    it('sends an empty object as the body when no search filter is provided', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse([]));

      await apiService.searchNotes();

      const [, options] = fetchMock.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({});
    });
  });

  it('sends a GET request for getAllNotes', async () => {
    fetchMock.mockResolvedValueOnce(buildMockResponse([]));

    await apiService.getAllNotes();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.notes}`);
    expect(options.method).toBe('GET');
  });

  it('sends a GET request for getNote', async () => {
    fetchMock.mockResolvedValueOnce(buildMockResponse({ id: 1 }));

    await apiService.getNote(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.noteById(1)}`);
    expect(options.method).toBe('GET');
  });

  it('sends a POST request for createNote', async () => {
    fetchMock.mockResolvedValueOnce(buildMockResponse({ id: 1 }));
    const payload = { title: 'My note' };

    await apiService.createNote(payload);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.notes}`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  it('sends a PUT request for updateNote', async () => {
    fetchMock.mockResolvedValueOnce(buildMockResponse({ id: 1 }));
    const payload = { title: 'Updated' };

    await apiService.updateNote(1, payload);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.noteById(1)}`);
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  it('sends a DELETE request for deleteNote', async () => {
    fetchMock.mockResolvedValueOnce(
      buildMockResponse(undefined, { contentType: null }),
    );

    await apiService.deleteNote(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.noteById(1)}`);
    expect(options.method).toBe('DELETE');
  });

  it('sends a GET request for getNotesCount', async () => {
    fetchMock.mockResolvedValueOnce(buildMockResponse({ count: 0 }));

    await apiService.getNotesCount();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.notesCount}`);
    expect(options.method).toBe('GET');
  });
});
