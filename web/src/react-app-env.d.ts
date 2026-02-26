/// <reference types="react-scripts" />

// Declare module for JSON files to support dynamic imports
declare module '*.json' {
  const value: unknown;
  export default value;
}
