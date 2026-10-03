import { downloadBlob, timestampForFilename } from './fileDownload';

describe('fileDownload', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('downloadBlob', () => {
    it.each([
      {
        name: 'a plain-text log',
        blob: new Blob(['line'], { type: 'text/plain' }),
        filename: 'word-flashcard.log',
      },
      {
        name: 'a zip archive',
        blob: new Blob(['PK'], { type: 'application/zip' }),
        filename: 'word-flashcard-logs.zip',
      },
    ])(
      'saves $name through a temporary anchor and releases the object URL',
      ({ blob, filename }) => {
        window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
        window.URL.revokeObjectURL = vi.fn();
        let clicked: { href: string; download: string } | undefined;
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
          function (this: HTMLAnchorElement) {
            clicked = { href: this.href, download: this.download };
          },
        );

        downloadBlob(blob, filename);

        expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
        expect(clicked).toEqual({ href: 'blob:mock-url', download: filename });
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(
          'blob:mock-url',
        );
        expect(document.querySelector('a[download]')).toBeNull();
      },
    );
  });

  describe('timestampForFilename', () => {
    it.each([
      {
        now: '2026-10-03T08:15:30.123Z',
        expected: '2026-10-03T08-15-30-123Z',
      },
      {
        now: '2026-01-01T00:00:00.000Z',
        expected: '2026-01-01T00-00-00-000Z',
      },
    ])('formats $now as $expected', ({ now, expected }) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(now));

      expect(timestampForFilename()).toBe(expected);
    });
  });
});
