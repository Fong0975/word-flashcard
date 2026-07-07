import { useState } from 'react';

/**
 * Backs a piece of state with an externally-provided value/setter pair when
 * given, falling back to an internally-managed value otherwise — the same
 * "controlled vs. uncontrolled" choice React form inputs offer, generalized
 * to any hook. Useful for letting a parent share one piece of state across
 * multiple mounts of a child that would otherwise manage it internally.
 */
export const useControllableState = <T>(
  externalValue: T | undefined,
  externalSetValue: ((value: T) => void) | undefined,
  defaultValue: T,
): [T, (value: T) => void] => {
  const [internalValue, setInternalValue] = useState<T>(defaultValue);

  const value = externalValue ?? internalValue;
  const setValue = externalSetValue ?? setInternalValue;

  return [value, setValue];
};
