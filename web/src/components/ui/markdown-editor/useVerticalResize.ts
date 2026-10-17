import React, { useRef, useState } from 'react';

/** Height change applied per ArrowUp/ArrowDown press on the resize handle. */
export const RESIZE_KEYBOARD_STEP_PX = 16;

/** Rounds `height` to whole pixels and keeps it from dropping below `minHeight`. */
export const clampResizeHeight = (height: number, minHeight: number): number =>
  Math.max(minHeight, Math.round(height));

/**
 * Resolves the height a resize-handle key press leads to.
 *
 * @param key - `KeyboardEvent.key` of the press.
 * @param currentHeight - Rendered height of the resized element.
 * @param minHeight - Height the element must not shrink below.
 * @returns The new height, or `null` when the key is not a resize key.
 */
export const getKeyboardResizeHeight = (
  key: string,
  currentHeight: number,
  minHeight: number,
): number | null => {
  switch (key) {
    case 'ArrowDown':
      return clampResizeHeight(
        currentHeight + RESIZE_KEYBOARD_STEP_PX,
        minHeight,
      );
    case 'ArrowUp':
      return clampResizeHeight(
        currentHeight - RESIZE_KEYBOARD_STEP_PX,
        minHeight,
      );
    case 'Home':
      return minHeight;
    default:
      return null;
  }
};

interface DragStart {
  pointerY: number;
  height: number;
  minHeight: number;
}

/** Props to spread onto the element acting as the resize handle. */
export interface VerticalResizeHandleProps {
  role: 'separator';
  'aria-orientation': 'horizontal';
  'aria-label': string;
  'aria-valuenow'?: number;
  'aria-valuemin'?: number;
  tabIndex: 0;
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onLostPointerCapture: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
}

/**
 * Lets a handle grow or shrink `targetRef`'s element vertically by pointer
 * drag or keyboard. The element's height at the first interaction becomes
 * the minimum, so it never shrinks below its original CSS height. The height
 * lives in component state only and resets when the owner unmounts.
 *
 * @param targetRef - Element whose height is being adjusted.
 * @returns `height` (`null` until the first resize, meaning "use the CSS
 *   height") and `handleProps` for the handle element.
 */
export const useVerticalResize = (
  targetRef: React.RefObject<HTMLElement | null>,
) => {
  const [height, setHeight] = useState<number | null>(null);
  const [minHeight, setMinHeight] = useState<number | null>(null);
  const dragStartRef = useRef<DragStart | null>(null);

  /** Reads the target's rendered height and the minimum, fixing the minimum on first use. */
  const measure = (): { current: number; min: number } | null => {
    const target = targetRef.current;
    if (!target) {
      return null;
    }
    const current = target.offsetHeight;
    const min = minHeight ?? current;
    if (minHeight === null) {
      setMinHeight(min);
    }
    return { current, min };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) {
      return;
    }
    const measured = measure();
    if (!measured) {
      return;
    }
    // Stops the drag from selecting text in the editor.
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      pointerY: e.clientY,
      height: measured.current,
      minHeight: measured.min,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const start = dragStartRef.current;
    if (!start) {
      return;
    }
    setHeight(
      clampResizeHeight(
        start.height + e.clientY - start.pointerY,
        start.minHeight,
      ),
    );
  };

  const endDrag = () => {
    dragStartRef.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const measured = measure();
    if (!measured) {
      return;
    }
    const next = getKeyboardResizeHeight(e.key, measured.current, measured.min);
    if (next === null) {
      return;
    }
    e.preventDefault();
    setHeight(next);
  };

  const handleProps: VerticalResizeHandleProps = {
    role: 'separator',
    'aria-orientation': 'horizontal',
    'aria-label': 'Resize editor',
    'aria-valuenow': height ?? minHeight ?? undefined,
    'aria-valuemin': minHeight ?? undefined,
    tabIndex: 0,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onLostPointerCapture: endDrag,
    onKeyDown,
  };

  return { height, handleProps };
};
