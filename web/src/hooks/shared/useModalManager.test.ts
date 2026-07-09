import { renderHook, act } from '@testing-library/react';

import { useModalManager } from './useModalManager';

describe('useModalManager', () => {
  it('reports a modal as closed before it has been opened', () => {
    const { result } = renderHook(() => useModalManager<string>());

    expect(result.current.isModalOpen('edit')).toBe(false);
    expect(result.current.getModalData('edit')).toBeUndefined();
  });

  it('opens a modal with associated data', () => {
    const { result } = renderHook(() => useModalManager<string>());

    act(() => {
      result.current.openModal('edit', 'word-1');
    });

    expect(result.current.isModalOpen('edit')).toBe(true);
    expect(result.current.getModalData('edit')).toBe('word-1');
  });

  it('closes a modal and clears its data', () => {
    const { result } = renderHook(() => useModalManager<string>());

    act(() => {
      result.current.openModal('edit', 'word-1');
    });
    act(() => {
      result.current.closeModal('edit');
    });

    expect(result.current.isModalOpen('edit')).toBe(false);
    expect(result.current.getModalData('edit')).toBeUndefined();
  });

  it('updates data for an already-open modal without closing it', () => {
    const { result } = renderHook(() => useModalManager<string>());

    act(() => {
      result.current.openModal('edit', 'word-1');
    });
    act(() => {
      result.current.setModalData('edit', 'word-2');
    });

    expect(result.current.isModalOpen('edit')).toBe(true);
    expect(result.current.getModalData('edit')).toBe('word-2');
  });

  it('keeps modals independent of one another', () => {
    const { result } = renderHook(() => useModalManager<string>());

    act(() => {
      result.current.openModal('edit', 'word-1');
      result.current.openModal('delete', 'word-2');
    });

    expect(result.current.isModalOpen('edit')).toBe(true);
    expect(result.current.isModalOpen('delete')).toBe(true);
    expect(result.current.getModalData('edit')).toBe('word-1');
    expect(result.current.getModalData('delete')).toBe('word-2');
  });

  it('closes all open modals and clears their data', () => {
    const { result } = renderHook(() => useModalManager<string>());

    act(() => {
      result.current.openModal('edit', 'word-1');
      result.current.openModal('delete', 'word-2');
    });
    act(() => {
      result.current.closeAllModals();
    });

    expect(result.current.isModalOpen('edit')).toBe(false);
    expect(result.current.isModalOpen('delete')).toBe(false);
    expect(result.current.getModalData('edit')).toBeUndefined();
  });
});
