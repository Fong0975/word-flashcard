import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { MockInstance } from 'vitest';

import { Word } from '../../../types/api';
import { FamiliarityLevel } from '../../../types/base';
import { apiService } from '../../../lib/api';

import { WordDetailPage } from './WordDetailPage';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => vi.fn(),
  useParams: () => ({ wordText: 'apple' }),
}));

// The modals have their own dedicated tests and play no part in the document
// title, so they're stubbed out entirely.
vi.mock('../word-form', () => ({ WordFormModal: () => null }));
vi.mock('../definition-form', () => ({ DefinitionFormModal: () => null }));

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.YELLOW,
  reminder: null,
  count_practise: 0,
  definitions: [],
  ...overrides,
});

describe('WordDetailPage document title', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // DetailPageLayout renders the real Header, whose useDarkMode hook reads
    // window.matchMedia; jsdom doesn't implement it, so stub it out.
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it.each<[string, () => Promise<Word[]>, string]>([
    [
      'from the URL word text while loading',
      () => new Promise<Word[]>(() => {}),
      'Word - apple | Flashcard',
    ],
    [
      'from the fetched word once loaded',
      () => Promise.resolve([buildWord({ word: 'Apple' })]),
      'Word - Apple | Flashcard',
    ],
    [
      'with a word over the width limit',
      () => Promise.resolve([buildWord({ word: 'w'.repeat(41) })]),
      `Word - ${'w'.repeat(39)}… | Flashcard`,
    ],
    [
      'when no word matches',
      () => Promise.resolve([]),
      'Word - Not found | Flashcard',
    ],
    [
      'when the request fails',
      () => Promise.reject(new Error('boom')),
      'Word - Not found | Flashcard',
    ],
  ])('sets the document title %s', async (_, searchWords, expectedTitle) => {
    vi.spyOn(apiService, 'searchWords').mockImplementation(searchWords);

    render(
      <MemoryRouter>
        <WordDetailPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(document.title).toBe(expectedTitle));
  });
});
