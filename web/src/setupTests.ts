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
