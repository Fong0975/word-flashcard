import { renderHook } from '@testing-library/react';

import { useModalScrollManager } from './useModalScrollManager';

describe('useModalScrollManager', () => {
  afterEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.documentElement.style.overflow = '';
  });

  it('locks scrolling when a modal opens', () => {
    renderHook(() => useModalScrollManager(true));

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('does not lock scrolling while closed', () => {
    renderHook(() => useModalScrollManager(false));
    expect(document.body.style.overflow).toBe('');
  });

  it('restores scrolling when the modal closes', () => {
    const { rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) => useModalScrollManager(isOpen),
      { initialProps: { isOpen: true } },
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender({ isOpen: false });
    expect(document.body.style.overflow).toBe('');
  });

  it('restores scrolling when the modal unmounts while open', () => {
    const { unmount } = renderHook(() => useModalScrollManager(true));
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('keeps scrolling locked until the last of several open modals closes', () => {
    const { rerender: rerenderFirst } = renderHook(
      ({ isOpen }: { isOpen: boolean }) => useModalScrollManager(isOpen),
      { initialProps: { isOpen: true } },
    );
    const { rerender: rerenderSecond } = renderHook(
      ({ isOpen }: { isOpen: boolean }) => useModalScrollManager(isOpen),
      { initialProps: { isOpen: true } },
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerenderFirst({ isOpen: false });
    expect(document.body.style.overflow).toBe('hidden');

    rerenderSecond({ isOpen: false });
    expect(document.body.style.overflow).toBe('');
  });
});
