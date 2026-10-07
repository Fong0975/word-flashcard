// Extends Jest's `expect` with DOM-specific matchers (e.g. toBeInTheDocument).
import '@testing-library/jest-dom';
// jsdom's test environment doesn't expose TextEncoder/TextDecoder as globals,
// but react-router references them at module load time. Node's `util` module
// has always provided them; just wire them onto the global object.
import { TextEncoder, TextDecoder } from 'util';

import { cleanup } from '@testing-library/react';

// @testing-library/dom's `waitFor` only drives its polling loop through fake
// timers when `typeof jest !== 'undefined'` (see jestFakeTimersAreEnabled in
// its helpers.js) — it has no equivalent check for Vitest's `vi`. Without
// this shim, `waitFor` silently falls back to real timers while `vi`'s fake
// clock is active, so it never observes the fake-timer-driven state update
// and times out. `advanceTimersByTime` is the only method it calls.
if (typeof (globalThis as { jest?: unknown }).jest === 'undefined') {
  (
    globalThis as {
      jest?: { advanceTimersByTime: typeof vi.advanceTimersByTime };
    }
  ).jest = {
    advanceTimersByTime: (...args) => vi.advanceTimersByTime(...args),
  };
}

// @testing-library/react registers its automatic cleanup in an `afterEach`
// at module-evaluation time. With `isolate: false` the module is evaluated
// once per worker, so only the first test file in each worker would get it
// and later files would see DOM left over from earlier tests. Setup files
// run for every test file, so register it here instead.
afterEach(() => {
  cleanup();
});

// jsdom traverses history asynchronously, and with `isolate: false` its
// window is shared by every test file in a worker, so a `history.back()`
// issued by one test (e.g. the unsaved-changes guard dropping its history
// entry on unmount) would fire its popstate in the middle of a later test.
// Run the traversal synchronously instead: land on an entry without state
// and fire popstate right away. Assigned directly rather than via `vi.spyOn`
// so that `vi.restoreAllMocks()` in a test file does not undo it. Test files
// that opt into the node environment have no window to patch.
if (typeof window !== 'undefined') {
  window.history.back = () => {
    window.history.replaceState(null, '');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
}

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

// This jsdom version's Blob (and therefore File, which extends it) doesn't
// implement the `.text()` method real browsers support. Polyfill it via
// FileReader, which jsdom does implement, so components/tests reading an
// uploaded file's contents don't need their own workaround.
if (typeof Blob.prototype.text === 'undefined') {
  Blob.prototype.text = function (): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}
