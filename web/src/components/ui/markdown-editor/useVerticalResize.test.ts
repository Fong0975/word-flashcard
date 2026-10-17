import React from 'react';
import { act, renderHook } from '@testing-library/react';

import {
  clampResizeHeight,
  getKeyboardResizeHeight,
  RESIZE_KEYBOARD_STEP_PX,
  useVerticalResize,
} from './useVerticalResize';

const INITIAL_HEIGHT = 208;

/**
 * Renders the hook against a div whose rendered height is stubbed, since
 * jsdom does no layout. After every interaction the stub picks up the hook's
 * height, the way the browser would once the editor applies it.
 */
const setup = (
  target: HTMLDivElement | null = document.createElement('div'),
) => {
  let renderedHeight = INITIAL_HEIGHT;
  if (target) {
    Object.defineProperty(target, 'offsetHeight', {
      configurable: true,
      get: () => renderedHeight,
    });
  }
  const hook = renderHook(() => useVerticalResize({ current: target }));
  const handle = document.createElement('div');
  const setPointerCapture = vi.fn();
  handle.setPointerCapture = setPointerCapture;
  let lastPreventDefault = vi.fn();

  const syncRenderedHeight = () => {
    renderedHeight = hook.result.current.height ?? renderedHeight;
  };

  const pointer = (
    type: 'onPointerDown' | 'onPointerMove' | 'onPointerUp',
    clientY: number,
    button = 0,
  ) => {
    act(() =>
      hook.result.current.handleProps[type]({
        button,
        clientY,
        pointerId: 1,
        currentTarget: handle,
        preventDefault: vi.fn(),
      } as unknown as React.PointerEvent<HTMLElement>),
    );
    syncRenderedHeight();
  };

  const key = (keyName: string) => {
    lastPreventDefault = vi.fn();
    act(() =>
      hook.result.current.handleProps.onKeyDown({
        key: keyName,
        preventDefault: lastPreventDefault,
      } as unknown as React.KeyboardEvent<HTMLElement>),
    );
    syncRenderedHeight();
  };

  return {
    hook,
    pointer,
    key,
    setPointerCapture,
    getLastPreventDefault: () => lastPreventDefault,
  };
};

type Harness = ReturnType<typeof setup>;

describe('clampResizeHeight', () => {
  const tests = [
    { name: 'below the minimum', height: 100, expected: 208 },
    { name: 'at the minimum', height: 208, expected: 208 },
    { name: 'above the minimum', height: 300, expected: 300 },
    { name: 'fractional height is rounded', height: 300.6, expected: 301 },
  ];

  it.each(tests)('$name', ({ height, expected }) => {
    expect(clampResizeHeight(height, 208)).toBe(expected);
  });
});

describe('getKeyboardResizeHeight', () => {
  const tests = [
    {
      name: 'ArrowDown grows by one step',
      key: 'ArrowDown',
      current: 208,
      expected: 208 + RESIZE_KEYBOARD_STEP_PX,
    },
    {
      name: 'ArrowUp shrinks by one step',
      key: 'ArrowUp',
      current: 300,
      expected: 300 - RESIZE_KEYBOARD_STEP_PX,
    },
    {
      name: 'ArrowUp stops at the minimum',
      key: 'ArrowUp',
      current: 210,
      expected: 208,
    },
    {
      name: 'Home resets to the minimum',
      key: 'Home',
      current: 400,
      expected: 208,
    },
    {
      name: 'other keys are ignored',
      key: 'Enter',
      current: 300,
      expected: null,
    },
  ];

  it.each(tests)('$name', ({ key, current, expected }) => {
    expect(getKeyboardResizeHeight(key, current, 208)).toBe(expected);
  });
});

describe('useVerticalResize', () => {
  const tests: {
    name: string;
    target?: HTMLDivElement | null;
    interact: (harness: Harness) => void;
    expectedHeight: number | null;
    expectedPointerCaptured?: boolean;
    expectedKeyPrevented?: boolean;
  }[] = [
    {
      name: 'starts unresized',
      interact: () => {},
      expectedHeight: null,
    },
    {
      name: 'dragging down captures the pointer and grows the element',
      interact: ({ pointer }) => {
        pointer('onPointerDown', 100);
        pointer('onPointerMove', 150);
      },
      expectedHeight: INITIAL_HEIGHT + 50,
      expectedPointerCaptured: true,
    },
    {
      name: 'dragging up stops at the initial height',
      interact: ({ pointer }) => {
        pointer('onPointerDown', 100);
        pointer('onPointerMove', 20);
      },
      expectedHeight: INITIAL_HEIGHT,
    },
    {
      name: 'a later drag shrinks back to, but not below, the initial height',
      interact: ({ pointer }) => {
        pointer('onPointerDown', 100);
        pointer('onPointerMove', 200);
        pointer('onPointerUp', 200);
        pointer('onPointerDown', 200);
        pointer('onPointerMove', 0);
      },
      expectedHeight: INITIAL_HEIGHT,
    },
    {
      name: 'moving without a drag in progress does nothing',
      interact: ({ pointer }) => pointer('onPointerMove', 300),
      expectedHeight: null,
    },
    {
      name: 'moving after the drag ends does nothing',
      interact: ({ pointer }) => {
        pointer('onPointerDown', 100);
        pointer('onPointerMove', 120);
        pointer('onPointerUp', 120);
        pointer('onPointerMove', 400);
      },
      expectedHeight: INITIAL_HEIGHT + 20,
    },
    {
      name: 'non-primary buttons do not start a drag',
      interact: ({ pointer }) => {
        pointer('onPointerDown', 100, 2);
        pointer('onPointerMove', 200);
      },
      expectedHeight: null,
      expectedPointerCaptured: false,
    },
    {
      name: 'no target element does not start a drag',
      target: null,
      interact: ({ pointer }) => {
        pointer('onPointerDown', 100);
        pointer('onPointerMove', 200);
      },
      expectedHeight: null,
      expectedPointerCaptured: false,
    },
    {
      name: 'ArrowDown grows the element instead of scrolling',
      interact: ({ key }) => key('ArrowDown'),
      expectedHeight: INITIAL_HEIGHT + RESIZE_KEYBOARD_STEP_PX,
      expectedKeyPrevented: true,
    },
    {
      name: 'ArrowUp after growing stops at the initial height',
      interact: ({ key }) => {
        key('ArrowDown');
        key('ArrowUp');
        key('ArrowUp');
      },
      expectedHeight: INITIAL_HEIGHT,
      expectedKeyPrevented: true,
    },
    {
      name: 'Home resets to the initial height',
      interact: ({ key }) => {
        key('ArrowDown');
        key('ArrowDown');
        key('Home');
      },
      expectedHeight: INITIAL_HEIGHT,
      expectedKeyPrevented: true,
    },
    {
      name: 'other keys are left to the browser',
      interact: ({ key }) => key('Tab'),
      expectedHeight: null,
      expectedKeyPrevented: false,
    },
  ];

  it.each(tests)(
    '$name',
    ({
      target,
      interact,
      expectedHeight,
      expectedPointerCaptured,
      expectedKeyPrevented,
    }) => {
      const harness = setup(target);

      interact(harness);

      const { height, handleProps } = harness.hook.result.current;
      expect(height).toBe(expectedHeight);
      expect(handleProps).toMatchObject({
        role: 'separator',
        'aria-orientation': 'horizontal',
      });
      if (expectedHeight !== null) {
        expect(handleProps['aria-valuenow']).toBe(expectedHeight);
        expect(handleProps['aria-valuemin']).toBe(INITIAL_HEIGHT);
      }
      if (expectedPointerCaptured !== undefined) {
        expect(harness.setPointerCapture).toHaveBeenCalledTimes(
          expectedPointerCaptured ? 1 : 0,
        );
      }
      if (expectedKeyPrevented !== undefined) {
        expect(harness.getLastPreventDefault()).toHaveBeenCalledTimes(
          expectedKeyPrevented ? 1 : 0,
        );
      }
    },
  );
});
