import { renderHook, act } from '@testing-library/react';

import { useToast } from './useToast';

describe('useToast', () => {
  it('starts with no toasts', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('shows a success toast with the default duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Saved');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Saved',
      type: 'success',
      duration: 4000,
    });
  });

  it.each([
    ['showSuccess', 'success'],
    ['showError', 'error'],
    ['showWarning', 'warning'],
    ['showInfo', 'info'],
  ] as const)('%s creates a toast of type %s', (method, type) => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current[method]('Message');
    });

    expect(result.current.toasts[0].type).toBe(type);
  });

  it('honors a custom duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showError('Failed', 1000);
    });

    expect(result.current.toasts[0].duration).toBe(1000);
  });

  it('appends multiple toasts in order', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('First');
      result.current.showError('Second');
    });

    expect(result.current.toasts.map(t => t.message)).toEqual([
      'First',
      'Second',
    ]);
  });

  it('removes a toast by id', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Saved');
    });
    const id = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(id);
    });

    expect(result.current.toasts).toEqual([]);
  });

  it('clears all toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('First');
      result.current.showError('Second');
    });
    act(() => {
      result.current.clearAllToasts();
    });

    expect(result.current.toasts).toEqual([]);
  });

  it('assigns each toast a unique id', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('First');
      result.current.showSuccess('Second');
    });

    const [first, second] = result.current.toasts;
    expect(first.id).not.toBe(second.id);
  });
});
