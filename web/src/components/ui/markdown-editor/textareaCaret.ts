/** Vertical extent of the caret, in the textarea's scrollable content coordinates. */
export interface CaretBounds {
  top: number;
  height: number;
}

/** Computed styles that affect how the textarea lays out its text. */
const MIRRORED_PROPERTIES = [
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'letterSpacing',
  'lineHeight',
  'textIndent',
  'textTransform',
  'wordSpacing',
  'tabSize',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
] as const;

/** Line height to assume when the computed `line-height` is `normal`. */
const NORMAL_LINE_HEIGHT_RATIO = 1.2;

const getLineHeight = (style: CSSStyleDeclaration): number => {
  const lineHeight = parseFloat(style.lineHeight);
  if (Number.isFinite(lineHeight)) {
    return lineHeight;
  }
  const fontSize = parseFloat(style.fontSize);
  return Number.isFinite(fontSize) ? fontSize * NORMAL_LINE_HEIGHT_RATIO : 0;
};

/**
 * Measures where the caret at `position` sits inside the textarea's scrollable
 * content.
 *
 * Textareas expose no caret geometry, so the text before the caret is laid out
 * in a hidden element styled like the textarea, and the offset of a marker
 * placed right after it gives the caret's line. The marker holds the rest of
 * the text so that the line containing the caret wraps exactly as it does in
 * the textarea.
 *
 * @param textarea - The textarea to measure
 * @param position - Caret position as a character offset into the value
 * @returns The caret's top offset and line height, in pixels
 */
export const measureCaretBounds = (
  textarea: HTMLTextAreaElement,
  position: number,
): CaretBounds => {
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement('div');

  for (const property of MIRRORED_PROPERTIES) {
    mirror.style[property] = style[property];
  }
  Object.assign(mirror.style, {
    position: 'absolute',
    top: '0',
    left: '-9999px',
    visibility: 'hidden',
    overflow: 'hidden',
    boxSizing: 'border-box',
    // clientWidth excludes the border and the scrollbar, matching the area
    // the textarea actually wraps its text in.
    width: `${textarea.clientWidth}px`,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
  });

  mirror.textContent = textarea.value.slice(0, position);
  const marker = document.createElement('span');
  marker.textContent = textarea.value.slice(position) || '.';
  mirror.appendChild(marker);

  document.body.appendChild(mirror);
  const top = marker.offsetTop;
  mirror.remove();

  return { top, height: getLineHeight(style) };
};

/**
 * Returns the scroll offset that brings the caret into view while scrolling
 * as little as possible: unchanged when the caret is already visible,
 * otherwise just enough to align it with the nearest edge.
 *
 * @param scrollTop - Current scroll offset
 * @param viewportHeight - Visible height of the scroll area
 * @param caret - Caret bounds in the same coordinates as `scrollTop`
 * @returns The scroll offset to apply
 */
export const getScrollTopToReveal = (
  scrollTop: number,
  viewportHeight: number,
  caret: CaretBounds,
): number => {
  const caretBottom = caret.top + caret.height;
  if (caret.top < scrollTop) {
    return caret.top;
  }
  if (caretBottom > scrollTop + viewportHeight) {
    return caretBottom - viewportHeight;
  }
  return scrollTop;
};
