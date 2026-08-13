/// <reference types="vite-plugin-pwa/client" />

// Declare module for JSON files to support dynamic imports
declare module '*.json' {
  const value: unknown;
  export default value;
}
