import { getScrollTopToReveal, measureCaretBounds } from './textareaCaret';

describe('measureCaretBounds', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it.each([
    {
      name: 'uses the computed line height',
      value: 'abc\ndef',
      position: 5,
      style: { lineHeight: '20px', fontSize: '14px' },
      expected: {
        bounds: { top: 42, height: 20 },
        before: 'abc\nd',
        marker: 'ef',
      },
    },
    {
      name: 'derives the line height from the font size when it is normal',
      value: 'abc',
      position: 1,
      style: { lineHeight: 'normal', fontSize: '10px' },
      expected: { bounds: { top: 42, height: 12 }, before: 'a', marker: 'bc' },
    },
    {
      name: 'falls back to a zero height without usable font metrics',
      value: 'abc',
      position: 0,
      style: {},
      expected: { bounds: { top: 42, height: 0 }, before: '', marker: 'abc' },
    },
    {
      name: 'keeps a placeholder marker when the caret is at the end',
      value: 'abc',
      position: 3,
      style: { lineHeight: '20px' },
      expected: {
        bounds: { top: 42, height: 20 },
        before: 'abc',
        marker: '.',
      },
    },
  ])('$name', ({ value, position, style, expected }) => {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    Object.assign(textarea.style, style);
    document.body.appendChild(textarea);

    let measured: { before: string; marker: string } | null = null;
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(
      function (this: HTMLElement) {
        measured = {
          before: this.previousSibling?.textContent ?? '',
          marker: this.textContent ?? '',
        };
        return 42;
      },
    );

    expect(measureCaretBounds(textarea, position)).toEqual(expected.bounds);
    expect(measured).toEqual({
      before: expected.before,
      marker: expected.marker,
    });
    expect(document.body.children).toHaveLength(1);
  });
});

describe('getScrollTopToReveal', () => {
  it.each([
    {
      name: 'keeps the scroll position when the caret is visible',
      scrollTop: 100,
      caret: { top: 150, height: 20 },
      expected: 100,
    },
    {
      name: 'keeps the scroll position when the caret touches both edges',
      scrollTop: 100,
      caret: { top: 100, height: 200 },
      expected: 100,
    },
    {
      name: 'scrolls up to align a caret above the viewport with the top edge',
      scrollTop: 100,
      caret: { top: 40, height: 20 },
      expected: 40,
    },
    {
      name: 'scrolls up when the caret is only partly visible at the top',
      scrollTop: 100,
      caret: { top: 90, height: 20 },
      expected: 90,
    },
    {
      name: 'scrolls down to align a caret below the viewport with the bottom edge',
      scrollTop: 100,
      caret: { top: 400, height: 20 },
      expected: 220,
    },
    {
      name: 'scrolls down when the caret is only partly visible at the bottom',
      scrollTop: 100,
      caret: { top: 290, height: 20 },
      expected: 110,
    },
  ])('$name', ({ scrollTop, caret, expected }) => {
    expect(getScrollTopToReveal(scrollTop, 200, caret)).toEqual(expected);
  });
});
