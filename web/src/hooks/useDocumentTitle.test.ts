import { renderHook } from '@testing-library/react';

import { PageTitleOptions } from '../utils/pageTitle';

import { useDocumentTitle } from './useDocumentTitle';

interface TitleProps {
  pageType?: string | null;
  detail?: string | null;
  options?: PageTitleOptions;
}

describe('useDocumentTitle', () => {
  afterEach(() => {
    document.title = '';
  });

  it.each<[string, TitleProps, TitleProps, string, string]>([
    [
      'the detail changes',
      { pageType: 'Word', detail: 'apple' },
      { pageType: 'Word', detail: 'banana' },
      'Word - apple | Flashcard',
      'Word - banana | Flashcard',
    ],
    [
      'the page type changes',
      { pageType: 'Note', detail: 'My note' },
      { pageType: 'Edit Note', detail: 'My note' },
      'Note - My note | Flashcard',
      'Edit Note - My note | Flashcard',
    ],
    [
      'the detail arrives after loading',
      { pageType: 'Question', options: { detailPrefix: '#12' } },
      { pageType: 'Question', detail: 'Q?', options: { detailPrefix: '#12' } },
      'Question - #12 | Flashcard',
      'Question - #12 Q? | Flashcard',
    ],
    [
      'every part is cleared',
      { pageType: 'Words' },
      {},
      'Words | Flashcard',
      'Flashcard',
    ],
  ])(
    'sets the title and updates it when %s',
    (_, initialProps, nextProps, initialTitle, nextTitle) => {
      const { rerender } = renderHook(
        ({ pageType, detail, options }: TitleProps) =>
          useDocumentTitle(pageType, detail, options),
        { initialProps },
      );

      expect(document.title).toBe(initialTitle);

      rerender(nextProps);

      expect(document.title).toBe(nextTitle);
    },
  );
});
