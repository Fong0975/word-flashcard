import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
} from 'react';

const DEFAULT_TAP_HINT_DURATION_MS = 4000;

let activeOwnerId: string | null = null;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getActiveOwnerId = () => activeOwnerId;

const setActiveOwnerId = (id: string | null) => {
  if (activeOwnerId === id) {
    return;
  }
  activeOwnerId = id;
  listeners.forEach(listener => listener());
};

const releaseIfOwner = (id: string) => {
  if (activeOwnerId === id) {
    setActiveOwnerId(null);
  }
};

export interface UseSilentModeHintReturn {
  isVisible: boolean;
  handlers: {
    onFocus: () => void;
    onBlur: () => void;
    onClick: () => void;
  };
}

/**
 * Controls visibility of a hint that follows an element's focus state.
 * The hint is shared across all hook instances: only the element most
 * recently focused or clicked owns it, so sibling buttons never show
 * overlapping hints. iOS Safari does not focus buttons when tapped, so a
 * click also reveals the hint for a limited time.
 * @param enabled - When false the hint is never visible.
 * @param tapDurationMs - How long the hint stays visible after a click.
 */
export const useSilentModeHint = (
  enabled: boolean,
  tapDurationMs = DEFAULT_TAP_HINT_DURATION_MS,
): UseSilentModeHintReturn => {
  const id = useId();
  const ownerId = useSyncExternalStore(subscribe, getActiveOwnerId);
  const isFocusedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      releaseIfOwner(id);
    },
    [id],
  );

  const onFocus = useCallback(() => {
    isFocusedRef.current = true;
    setActiveOwnerId(id);
  }, [id]);

  const onBlur = useCallback(() => {
    isFocusedRef.current = false;
    releaseIfOwner(id);
  }, [id]);

  const onClick = useCallback(() => {
    setActiveOwnerId(id);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      if (!isFocusedRef.current) {
        releaseIfOwner(id);
      }
    }, tapDurationMs);
  }, [id, tapDurationMs]);

  return {
    isVisible: enabled && ownerId === id,
    handlers: { onFocus, onBlur, onClick },
  };
};
