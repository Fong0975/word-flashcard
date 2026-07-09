import { renderHook, act } from '@testing-library/react';

import { useControllableState } from './useControllableState';

describe('useControllableState', () => {
  it('uses the default value when uncontrolled', () => {
    const { result } = renderHook(() =>
      useControllableState<string>(undefined, undefined, 'default'),
    );
    expect(result.current[0]).toBe('default');
  });

  it('updates internal state when uncontrolled', () => {
    const { result } = renderHook(() =>
      useControllableState<string>(undefined, undefined, 'default'),
    );

    act(() => {
      result.current[1]('changed');
    });

    expect(result.current[0]).toBe('changed');
  });

  it('uses the external value when controlled', () => {
    const { result } = renderHook(() =>
      useControllableState<string>('external', jest.fn(), 'default'),
    );
    expect(result.current[0]).toBe('external');
  });

  it('calls the external setter instead of updating internal state when controlled', () => {
    const externalSetValue = jest.fn();
    const { result } = renderHook(() =>
      useControllableState<string>('external', externalSetValue, 'default'),
    );

    act(() => {
      result.current[1]('new value');
    });

    expect(externalSetValue).toHaveBeenCalledWith('new value');
    expect(result.current[0]).toBe('external');
  });
});
