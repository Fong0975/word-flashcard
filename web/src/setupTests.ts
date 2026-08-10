// Extends Jest's `expect` with DOM-specific matchers (e.g. toBeInTheDocument).
// react-scripts automatically picks this file up before running tests.
import '@testing-library/jest-dom';

// jsdom's test environment doesn't expose TextEncoder/TextDecoder as globals,
// but react-router references them at module load time. Node's `util` module
// has always provided them; just wire them onto the global object.
import { TextEncoder, TextDecoder } from 'util';

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
